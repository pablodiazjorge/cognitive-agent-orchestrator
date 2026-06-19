import express, { Request, Response, Router } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { runAgentLoop } from './core/agent-loop.js';
import { AgentEvent } from './core/agent-event.js';
import { LlmProvider } from './providers/llm-provider.interface.js';
import { calculatorTool } from './tools/calculator.tool.js';
import { weatherTool } from './tools/weather.tool.js';
import { searchTool } from './tools/search.tool.js';

interface Session {
  events: AgentEvent[];
  status: 'running' | 'done' | 'error';
  listeners: Set<Response>;
}

const sessions = new Map<string, Session>();
const tools = [calculatorTool, weatherTool, searchTool];

function createSession(provider: LlmProvider, message: string): string {
  const sessionId = uuidv4();
  const session: Session = {
    events: [],
    status: 'running',
    listeners: new Set()
  };
  sessions.set(sessionId, session);

  runAgentLoop(
    message,
    (event) => addEvent(sessionId, event),
    { provider, tools, maxIterations: 10 }
  ).catch((err) => {
    console.error(`Agent loop error for session ${sessionId}:`, err);
    addEvent(sessionId, {
      type: 'error',
      content: err instanceof Error ? err.message : String(err),
      timestamp: Date.now()
    });
  });

  return sessionId;
}

function addEvent(sessionId: string, event: AgentEvent): void {
  const session = sessions.get(sessionId);
  if (!session) return;

  session.events.push(event);

  if (event.type === 'final_answer') {
    session.status = 'done';
  } else if (event.type === 'error') {
    session.status = 'error';
  }

  const payload = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
  for (const res of session.listeners) {
    res.write(payload);
  }

  if (session.status === 'done' || session.status === 'error') {
    for (const res of session.listeners) {
      res.end();
    }
    session.listeners.clear();
  }
}

function attachStream(sessionId: string, res: Response): void {
  const session = sessions.get(sessionId);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Replay stored events
  for (const event of session.events) {
    res.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
  }

  if (session.status === 'done' || session.status === 'error') {
    res.end();
    return;
  }

  session.listeners.add(res);

  res.on('close', () => {
    session.listeners.delete(res);
  });
}

export function createServer(provider: LlmProvider, providerName: string, model: string) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  const api = Router();

  api.post('/chat', (req: Request, res: Response) => {
    const message = req.body?.message;
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Field "message" is required and must be a string.' });
      return;
    }

    const sessionId = createSession(provider, message);
    res.status(202).json({ sessionId });
  });

  api.get('/chat/:sessionId/stream', (req: Request, res: Response) => {
    attachStream(req.params.sessionId, res);
  });

  api.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'UP', provider: providerName, model });
  });

  app.use('/api', api);

  return app;
}
