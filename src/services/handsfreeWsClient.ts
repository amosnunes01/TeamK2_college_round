/**
 * Handsfree WebSocket Bridge Client
 *
 * Runs inside the React app and sends tracking data to the local
 * WebSocket server (port 5187), which then relays it to extension
 * content scripts running in other browser tabs.
 *
 * Architecture:
 *   React App → WS Client (this file) → WS Server (Vite plugin)
 *             → Extension content scripts in ALL tabs (any origin)
 */

const WS_PORT = 5187;
const WS_URL = `ws://localhost:${WS_PORT}/?role=source`;
const RECONNECT_DELAY_MS = 2000;
const MAX_RECONNECT_ATTEMPTS = 10;

type WsMessage =
  | {
      type: 'HANDSFREE_BROADCAST';
      payload: {
        x: number;
        y: number;
        normX?: number;
        normY?: number;
        gesture?: string;
        isTracking: boolean;
      };
    }
  | { type: 'HANDSFREE_CLICK' }
  | { type: 'HANDSFREE_VOICE_COMMAND'; command: string; text?: string }
  | { type: 'HANDSFREE_STOP' };

class HandsfreeWsClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isDestroyed = false;
  private messageQueue: WsMessage[] = [];
  private isConnected = false;

  constructor() {
    this.connect();
  }

  private connect() {
    if (this.isDestroyed) return;

    try {
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        console.log('[Handsfree WS Client] Connected to bridge server');

        // Drain queued messages
        while (this.messageQueue.length > 0) {
          const msg = this.messageQueue.shift()!;
          this.sendRaw(msg);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        if (!this.isDestroyed) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = () => {
        // Error is followed by close; we handle reconnect there
        this.isConnected = false;
      };

    } catch (e) {
      console.warn('[Handsfree WS Client] Could not create WebSocket:', e);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.isDestroyed || this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) return;

    this.reconnectAttempts++;
    const delay = RECONNECT_DELAY_MS * Math.min(this.reconnectAttempts, 5);

    this.reconnectTimer = setTimeout(() => {
      if (!this.isDestroyed) {
        console.log(`[Handsfree WS Client] Reconnecting (attempt ${this.reconnectAttempts})...`);
        this.connect();
      }
    }, delay);
  }

  private sendRaw(msg: WsMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  send(msg: WsMessage) {
    if (this.isConnected) {
      this.sendRaw(msg);
    } else {
      // Queue broadcast messages only (last one wins to avoid stale queue)
      if (msg.type === 'HANDSFREE_BROADCAST') {
        const existing = this.messageQueue.findIndex((m) => m.type === 'HANDSFREE_BROADCAST');
        if (existing !== -1) this.messageQueue.splice(existing, 1);
      }
      this.messageQueue.push(msg);
    }
  }

  destroy() {
    this.isDestroyed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }
}

// Singleton instance — created lazily only in browser dev environment
let _client: HandsfreeWsClient | null = null;

export function getWsClient(): HandsfreeWsClient | null {
  // Only create in browser environment (not SSR/test)
  if (typeof window === 'undefined') return null;
  if (!_client) {
    _client = new HandsfreeWsClient();
  }
  return _client;
}

export function destroyWsClient() {
  _client?.destroy();
  _client = null;
}

export type { WsMessage };
