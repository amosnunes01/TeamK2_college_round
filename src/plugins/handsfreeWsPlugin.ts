import type { Plugin, ViteDevServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';

const WS_PORT = 5187;

/**
 * Handsfree WebSocket Bridge Plugin
 *
 * Creates a dedicated WebSocket server on port 5187 that acts as a
 * real-time relay hub between:
 *   - The Handsfree React app (SOURCE) sending tracking data
 *   - Chrome Extension content scripts (TARGETS) on other tabs
 *
 * Why WebSocket instead of chrome.runtime.sendMessage or chrome.storage?
 *   - chrome.storage.session is blocked by sandboxed iframes (Gmail, etc.)
 *   - chrome.runtime ports require service worker to be alive (MV3 sleeps)
 *   - WebSocket connections from content scripts bypass page CSP entirely
 *   - Works instantly with zero Chrome Extension API constraints
 */
export function handsfreeWsPlugin(): Plugin {
  let wss: WebSocketServer | null = null;
  const clients = new Set<WebSocket>();
  let lastBroadcastState: unknown = null;
  function startWss() {
    wss = new WebSocketServer({ port: WS_PORT });

    wss.on('listening', () => {
      console.log(`\n  [Handsfree WS] Bridge server ready on ws://localhost:${WS_PORT}`);
    });

    wss.on('connection', (ws, req) => {
      const clientType = req.url?.includes('source') ? 'SOURCE' : 'TARGET';
      clients.add(ws);
      console.log(`  [Handsfree WS] ${clientType} connected (total=${clients.size})`);

      // Send last known state to new targets so they get immediate pointer position
      if (clientType === 'TARGET' && lastBroadcastState) {
        ws.send(JSON.stringify(lastBroadcastState));
      }

      ws.on('message', (raw) => {
        try {
          const msg = JSON.parse(raw.toString());

          // Cache last broadcast state for late-joining targets
          if (msg.type === 'HANDSFREE_BROADCAST') {
            lastBroadcastState = msg;
          } else if (msg.type === 'HANDSFREE_STOP') {
            lastBroadcastState = null;
          }

          // Relay to all connected clients EXCEPT the sender
          clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(raw.toString());
            }
          });
        } catch (e) {
          console.error('[Handsfree WS] Bad message:', e);
        }
      });

      ws.on('close', () => {
        clients.delete(ws);
        console.log(`  [Handsfree WS] Client disconnected (remaining=${clients.size})`);
      });

      ws.on('error', (err) => {
        console.error('[Handsfree WS] Client error:', err.message);
        clients.delete(ws);
      });
    });

    wss.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`  [Handsfree WS] Port ${WS_PORT} is occupied; bridge is unavailable until it is freed.`);
      } else {
        console.error('[Handsfree WS] Server error:', err);
      }
    });
  }

  return {
    name: 'handsfree-ws-bridge',
    apply: 'serve',

    configureServer(server: ViteDevServer) {
      startWss();

      // Clean up when Vite shuts down
      server.httpServer?.on('close', () => {
        clients.forEach((c) => c.terminate());
        clients.clear();
        wss?.close(() => {
          console.log('  [Handsfree WS] Bridge server closed');
        });
      });
    },
  };
}
