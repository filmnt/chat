import type { ChatMessage, Message } from '../shared';

interface Env {
  ASSETS: any;
  Chat: DurableObjectNamespace;
}

export class Chat implements DurableObject {
  state: DurableObjectState;
  messages: ChatMessage[] = [];
  websockets: Set<WebSocket> = new Set();

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
  }

  async fetch(req: Request): Promise<Response> {
    const upgradeHeader = req.headers.get('Upgrade');
    if (upgradeHeader !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }

    const [client, server] = Object.values(new WebSocketPair());
    await this.handleSession(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async loadMessages() {
    const stored = await this.state.storage.get<ChatMessage[]>('messages');
    if (stored) {
      const cutoff = Date.now() - 24 * 3600 * 1000;
      this.messages = stored.filter((msg) => msg.timestamp >= cutoff && !msg.isSystem);
    }
  }

  async saveMessages() {
    const cutoff = Date.now() - 24 * 3600 * 1000;
    this.messages = this.messages.filter((msg) => msg.timestamp >= cutoff && !msg.isSystem);
    await this.state.storage.put('messages', this.messages);
  }

  async handleSession(ws: WebSocket) {
    ws.accept();
    this.websockets.add(ws);

    if (this.messages.length === 0) {
      await this.loadMessages();
    }

    ws.send(JSON.stringify({ type: 'sync', messages: this.messages }));

    ws.addEventListener('message', async (event) => {
      try {
        const data: Message = JSON.parse(event.data);
        if (data.type === 'add' || data.type === 'update') {
          if (!data.isSystem) {
            await this.saveMessage(data);
            this.broadcast(data);
          }
        } else if (data.type === 'requestSync') {
          ws.send(JSON.stringify({ type: 'sync', messages: this.messages }));
        }
      } catch (e) {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid data' }));
      }
    });

    ws.addEventListener('close', () => {
      this.websockets.delete(ws);
    });

    ws.addEventListener('error', () => {
      this.websockets.delete(ws);
    });
  }

  broadcast(message: Message) {
    for (const ws of this.websockets) {
      try {
        ws.send(JSON.stringify(message));
      } catch {
        this.websockets.delete(ws);
      }
    }
  }

  async saveMessage(message: Message) {
    const chatMessage: ChatMessage = {
      id: message.id,
      user: message.user,
      userId: message.userId,
      role: message.role,
      content: message.content,
      timestamp: message.timestamp,
      isSystem: message.isSystem || false,
    };

    const existing = this.messages.find((m) => m.id === message.id);
    if (existing) {
      this.messages = this.messages.map((m) => (m.id === message.id ? chatMessage : m));
    } else {
      this.messages.push(chatMessage);
    }

    await this.saveMessages();
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/chat')) {
      const id = env.Chat.idFromName('main');
      const stub = env.Chat.get(id);
      return stub.fetch(request);
    }

    return env.ASSETS.fetch(request);
  },
};