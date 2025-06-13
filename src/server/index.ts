interface Env {
  ASSETS: Fetcher;
  Chat: DurableObjectNamespace;
  API_KEY: string;
  TURNSTILE_SECRET_KEY: string;
}

export class Chat implements DurableObject {
  state: DurableObjectState;
  messages: ChatMessage[] = [];
  websockets: Map<WebSocket, { userId: string; nickname: string; verified: boolean }> = new Map();
  bannedUsers: Map<string, { nickname: string; until?: number }> = new Map();
  isChatFrozen: boolean = false;
  isAdminOnly: boolean = false;
  admins: Set<string> = new Set();
  apiKey: string;
  turnstileSecretKey: string;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.apiKey = env.API_KEY;
    this.turnstileSecretKey = env.TURNSTILE_SECRET_KEY;
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === '/verify-turnstile') {
      try {
        const body = await req.json();
        const token = body.token;
        const ip = req.headers.get('CF-Connecting-IP');

        const formData = new FormData();
        formData.append('secret', this.turnstileSecretKey);
        formData.append('response', token);
        if (ip) formData.append('remoteip', ip);

        const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          body: formData,
        });
        const result = await verifyResponse.json();

        return new Response(JSON.stringify({ success: result.success, error: result['error-codes'] || [] }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        return new Response(JSON.stringify({ success: false, error: 'Invalid request' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

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
      const cutoff = Date.now() - 7 * 24 * 3600 * 1000;
      this.messages = stored.filter((msg) => msg.timestamp >= cutoff && !msg.isSystem);
    }
  }

  async saveMessages() {
    const cutoff = Date.now() - 7 * 24 * 3600 * 1000;
    this.messages = this.messages.filter((msg) => msg.timestamp >= cutoff && !msg.isSystem);
    await this.state.storage.put('messages', this.messages);
  }

  async loadBannedUsers() {
    const stored = await this.state.storage.get<Map<string, { nickname: string; until?: number }>>('bannedUsers');
    if (stored) {
      const now = Date.now();
      this.bannedUsers = new Map([...stored].filter(([_, ban]) => !ban.until || ban.until > now));
    }
  }

  async saveBannedUsers() {
    const now = Date.now();
    this.bannedUsers = new Map([...this.bannedUsers].filter(([_, ban]) => !ban.until || ban.until > now));
    await this.state.storage.put('bannedUsers', this.bannedUsers);
  }

  async loadStates() {
    const [storedFrozen, storedAdminOnly, storedAdmins] = await Promise.all([
      this.state.storage.get<boolean>('isChatFrozen'),
      this.state.storage.get<boolean>('isAdminOnly'),
      this.state.storage.get<Set<string>>('admins'),
    ]);
    this.isChatFrozen = storedFrozen ?? false;
    this.isAdminOnly = storedAdminOnly ?? false;
    this.admins = storedAdmins ?? new Set();
  }

  async saveStates() {
    await Promise.all([
      this.state.storage.put('isChatFrozen', this.isChatFrozen),
      this.state.storage.put('isAdminOnly', this.isAdminOnly),
      this.state.storage.put('admins', this.admins),
    ]);
  }

  async handleSession(ws: WebSocket) {
    ws.accept();
    this.websockets.set(ws, { userId: '', nickname: '', verified: false });

    await Promise.all([this.loadMessages(), this.loadBannedUsers(), this.loadStates()]);

    ws.send(
      JSON.stringify({
        type: 'sync',
        messages: this.messages,
        users: Array.from(new Set(this.websockets.values().map((v) => v.nickname).filter((n) => n))),
        bannedUsers: Array.from(this.bannedUsers.entries()).map(([userId, ban]) => ({ userId, ...ban })),
        isChatFrozen: this.isChatFrozen,
        isAdminOnly: this.isAdminOnly,
      })
    );

    ws.addEventListener('message', async (event) => {
      try {
        const data: Message = JSON.parse(event.data.toString());
        const userInfo = this.websockets.get(ws);
        if (!userInfo) return;

        switch (data.type) {
          case 'requestSync': {
            userInfo.userId = data.userId;
            userInfo.nickname = data.nickname;
            userInfo.verified = true; // 검증 완료로 가정
            this.websockets.set(ws, userInfo);
            ws.send(
              JSON.stringify({
                type: 'sync',
                messages: this.messages,
                users: Array.from(new Set(this.websockets.values().map((v) => v.nickname).filter((n) => n))),
                bannedUsers: Array.from(this.bannedUsers.entries()).map(([userId, ban]) => ({ userId, ...ban })),
                isChatFrozen: this.isChatFrozen,
                isAdminOnly: this.isAdminOnly,
              })
            );
            ws.send(JSON.stringify({ type: 'SET_ADMIN', payload: this.admins.has(data.userId) }));
            this.broadcast({
              type: 'users',
              users: Array.from(new Set(this.websockets.values().map((v) => v.nickname).filter((n) => n))),
            });
            break;
          }
          case 'add':
          case 'update': {
            if (!userInfo.verified) {
              ws.send(JSON.stringify({ type: 'error', message: 'notVerified' }));
              return;
            }
            if (!data.isSystem && this.bannedUsers.has(userInfo.userId)) {
              const ban = this.bannedUsers.get(userInfo.userId);
              if (!ban?.until || ban.until > Date.now()) {
                ws.send(JSON.stringify({ type: 'error', message: ban?.until ? 'timeout' : 'banned', until: ban?.until }));
                return;
              }
            }
            if (!data.isSystem && (this.isChatFrozen || (this.isAdminOnly && !this.admins.has(userInfo.userId)))) {
              ws.send(JSON.stringify({ type: 'error', message: this.isChatFrozen ? 'frozen' : 'adminOnly' }));
              return;
            }
            if (!data.isSystem) {
              await this.saveMessage(data);
              this.broadcast(data);
            }
            break;
          }
          case 'authenticate': {
            if (data.apiKey === this.apiKey) {
              this.admins.add(data.userId);
              await this.saveStates();
              ws.send(JSON.stringify({ type: 'SET_ADMIN', payload: true }));
            } else {
              ws.send(JSON.stringify({ type: 'error', message: 'invalidApiKey' }));
            }
            break;
          }
          case 'logoutAdmin': {
            if (this.admins.has(data.userId)) {
              this.admins.delete(data.userId);
              await this.saveStates();
              ws.send(JSON.stringify({ type: 'SET_ADMIN', payload: false }));
              if (data.nickname) {
                userInfo.nickname = data.nickname;
                this.websockets.set(ws, userInfo);
                this.broadcast({
                  type: 'users',
                  users: Array.from(new Set(this.websockets.values().map((v) => v.nickname).filter((n) => n))),
                });
              }
            }
            break;
          }
          case 'freezeChat': {
            if (this.admins.has(data.userId)) {
              this.isChatFrozen = data.isFrozen;
              await this.saveStates();
              this.broadcast({ type: 'chatFrozen', isFrozen: this.isChatFrozen });
            }
            break;
          }
          case 'adminOnly': {
            if (this.admins.has(data.userId)) {
              this.isAdminOnly = data.isAdminOnly;
              await this.saveStates();
              this.broadcast({ type: 'adminOnly', isAdminOnly: this.isAdminOnly });
            }
            break;
          }
          case 'clearChat': {
            if (this.admins.has(data.userId)) {
              this.messages = [];
              await this.saveMessages();
              this.broadcast({ type: 'clearChat' });
            }
            break;
          }
          case 'deleteUserMessages': {
            if (this.admins.has(data.userId)) {
              this.messages = this.messages.filter((msg) => msg.userId !== data.targetUserId);
              await this.saveMessages();
              this.broadcast({ type: 'deleteUserMessages', userId: data.targetUserId });
            }
            break;
          }
          case 'banUser': {
            if (this.admins.has(data.userId)) {
              this.bannedUsers.set(data.targetUserId, { nickname: data.nickname, until: data.duration ? Date.now() + data.duration : undefined });
              await this.saveBannedUsers();
              this.broadcast({
                type: 'bannedUsers',
                bannedUsers: Array.from(this.bannedUsers.entries()).map(([userId, ban]) => ({ userId, ...ban })),
              });
              for (const [wsInstance, info] of this.websockets) {
                if (info.userId === data.targetUserId) {
                  wsInstance.send(JSON.stringify({ type: 'error', message: data.duration ? 'timeout' : 'banned', until: data.duration ? Date.now() + data.duration : undefined }));
                }
              }
            }
            break;
          }
          case 'unbanUser': {
            if (this.admins.has(data.userId)) {
              this.bannedUsers.delete(data.targetUserId);
              await this.saveBannedUsers();
              this.broadcast({
                type: 'bannedUsers',
                bannedUsers: Array.from(this.bannedUsers.entries()).map(([userId, ban]) => ({ userId, ...ban })),
              });
            }
            break;
          }
          case 'updateUser': {
            userInfo.nickname = data.nickname;
            this.websockets.set(ws, userInfo);
            this.broadcast({
              type: 'users',
              users: Array.from(new Set(this.websockets.values().map((v) => v.nickname).filter((n) => n))),
            });
            break;
          }
          default:
            ws.send(JSON.stringify({ type: 'error', message: 'invalidData' }));
        }
      } catch {
        ws.send(JSON.stringify({ type: 'error', message: 'invalidData' }));
      }
    });

    ws.addEventListener('close', () => {
      this.websockets.delete(ws);
      this.broadcast({
        type: 'users',
        users: Array.from(new Set(this.websockets.values().map((v) => v.nickname).filter((n) => n))),
      });
    });

    ws.addEventListener('error', () => {
      this.websockets.delete(ws);
      this.broadcast({
        type: 'users',
        users: Array.from(new Set(this.websockets.values().map((v) => v.nickname).filter((n) => n))),
      });
    });
  }

  broadcast(message: Message) {
    const messageStr = JSON.stringify(message);
    for (const ws of this.websockets.keys()) {
      try {
        ws.send(messageStr);
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
      isSystem: message.isSystem ?? false,
    };

    const existing = this.messages.find((msg) => msg.id === message.id);
    if (existing) {
      this.messages = this.messages.map((msg) => (msg.id === message.id ? chatMessage : msg));
    } else {
      this.messages.push(chatMessage);
    }

    await this.saveMessages();
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/verify-turnstile') {
      const id = env.Chat.idFromName('main');
      const stub = env.Chat.get(id);
      return stub.fetch(request);
    }

    if (url.pathname.startsWith('/chat') || url.pathname.match(/^\/chat\/parties\/chat\/[^\/]+$/)) {
      const id = env.Chat.idFromName('main');
      const stub = env.Chat.get(id);
      return stub.fetch(request);
    }

    return env.ASSETS.fetch(request);
  },
};