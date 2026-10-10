// Background script — port-based relay
// Long-lived ports keep the service worker alive AND work in sandboxed pages.
// All cross-tab messaging goes through these persistent connections.

const connectedPorts = new Map(); // portId -> port

let nextId = 0;

chrome.runtime.onConnect.addListener((port) => {
  const portId = nextId++;
  port._hfId = portId;
  connectedPorts.set(portId, port);

  console.log(`[Handsfree BG] Port connected: ${port.name} #${portId}, total=${connectedPorts.size}`);

  port.onMessage.addListener((msg) => {
    if (!msg || !msg.type || !msg.type.startsWith('HANDSFREE_')) return;

    // Relay to every TARGET port (skip the source that sent it)
    connectedPorts.forEach((p, id) => {
      if (id !== portId && p.name === 'handsfree-target') {
        try {
          p.postMessage(msg);
        } catch (e) {
          // Port disconnected but not yet cleaned up
          connectedPorts.delete(id);
        }
      }
    });
  });

  port.onDisconnect.addListener(() => {
    connectedPorts.delete(portId);
    console.log(`[Handsfree BG] Port disconnected #${portId}, remaining=${connectedPorts.size}`);
  });
});
