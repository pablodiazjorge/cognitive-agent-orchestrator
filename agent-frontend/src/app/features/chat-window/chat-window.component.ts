import { Component, inject, viewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgentStreamService } from '../../core/services/agent-stream.service';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-window.component.html',
  styleUrls: ['./chat-window.component.scss']
})
export class ChatWindowComponent {
  private readonly streamService = inject(AgentStreamService);

  readonly messages = this.streamService.messages;
  readonly isProcessing = this.streamService.isProcessing;

  userInput = '';
  private readonly scrollContainer = viewChild.required<ElementRef<HTMLDivElement>>('scrollContainer');

  constructor() {
    effect(() => {
      // Access signals to trigger scroll on every message change
      this.messages();
      this.isProcessing();
      this.scrollToBottom();
    });
  }

  sendMessage(): void {
    const text = this.userInput.trim();
    if (!text || this.isProcessing()) return;

    this.userInput = '';
    const observable = this.streamService.sendMessage(text);
    if (observable) {
      observable.subscribe({
        error: (err) => console.error('Stream error', err)
      });
    }
  }

  handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private scrollToBottom(): void {
    const container = this.scrollContainer()?.nativeElement;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }
}
