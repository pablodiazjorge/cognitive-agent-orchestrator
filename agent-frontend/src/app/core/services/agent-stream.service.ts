import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscriber } from 'rxjs';
import { AgentEvent, AgentEventType } from '../models/agent-event.model';
import { ChatMessage } from '../models/chat-message.model';

interface ChatSession {
  sessionId: string;
}

@Injectable({ providedIn: 'root' })
export class AgentStreamService {
  private readonly apiUrl = '/api';

  private readonly _messages = signal<ChatMessage[]>([]);
  private readonly _currentThoughts = signal<AgentEvent[]>([]);
  private readonly _isProcessing = signal(false);
  private _sending = false;

  readonly messages = this._messages.asReadonly();
  readonly currentThoughts = this._currentThoughts.asReadonly();
  readonly isProcessing = this._isProcessing.asReadonly();

  constructor(private readonly http: HttpClient) {}

  sendMessage(message: string): Observable<AgentEvent> | null {
    // Guard against duplicate calls (e.g. keydown + click fired simultaneously)
    if (this._sending) return null;
    this._sending = true;

    this._isProcessing.set(true);
    this._currentThoughts.set([]);
    this._messages.update((items) => [
      ...items,
      { role: 'user', content: message, timestamp: Date.now() }
    ]);

    return new Observable<AgentEvent>((subscriber) => {
      subscriber.add(() => {
        this._sending = false;
      });

      this.http.post<ChatSession>(`${this.apiUrl}/chat`, { message }).subscribe({
        next: ({ sessionId }) => this.openStream(sessionId, subscriber, message),
        error: (err) => {
          this.emitError(subscriber, err);
          this._isProcessing.set(false);
        }
      });
    });
  }

  private openStream(sessionId: string, subscriber: Subscriber<AgentEvent>, originalMessage: string): void {
    const source = new EventSource(`${this.apiUrl}/chat/${sessionId}/stream`);

    // The backend sends named SSE events (event: thinking, event: tool_call, ...).
    // EventSource.onmessage only catches unnamed "message" events, so we register
    // a listener for each known event type.
    const eventTypes: AgentEventType[] = ['thinking', 'tool_call', 'tool_result', 'final_answer', 'error'];
    for (const eventType of eventTypes) {
      source.addEventListener(eventType, (rawEvent) => {
        try {
          const event: AgentEvent = JSON.parse(rawEvent.data);
          this.handleEvent(event, source, subscriber, originalMessage);
        } catch {
          // Ignore malformed SSE payloads
        }
      });
    }

    source.onerror = () => {
      source.close();
      this._isProcessing.set(false);
      subscriber.complete();
    };

    // Cleanup when the observable is unsubscribed
    subscriber.add(() => {
      source.close();
      this._isProcessing.set(false);
    });
  }

  private handleEvent(
    event: AgentEvent,
    source: EventSource,
    subscriber: Subscriber<AgentEvent>,
    originalMessage: string
  ): void {
    subscriber.next(event);

    if (event.type === 'thinking' || event.type === 'tool_call' || event.type === 'tool_result') {
      this._currentThoughts.update((items) => [...items, event]);
    }

    if (event.type === 'final_answer') {
      this._messages.update((items) => [
        ...items,
        { role: 'agent', content: event.content ?? '', timestamp: event.timestamp }
      ]);
      // Keep currentThoughts visible so the user can review the agent's reasoning.
      // They will be cleared automatically when the next message is sent.
      this._isProcessing.set(false);
      source.close();
      subscriber.complete();
    }

    if (event.type === 'error') {
      this._messages.update((items) => [
        ...items,
        {
          role: 'agent',
          content: `Something went wrong: ${event.content ?? 'unknown error'}`,
          timestamp: event.timestamp
        }
      ]);
      // Keep currentThoughts visible for debugging.
      this._isProcessing.set(false);
      source.close();
      subscriber.complete();
    }
  }

  private emitError(subscriber: Subscriber<AgentEvent>, err: unknown): void {
    const content = err instanceof Error ? err.message : 'Failed to start chat session';
    const event: AgentEvent = { type: 'error', content, timestamp: Date.now() };
    subscriber.next(event);
    subscriber.complete();
  }
}
