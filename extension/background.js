// ============================================================
// Handsfree Extension — Background Service Worker
// Thin control bridge routing messages between Web App and Target tabs
// ============================================================

const connectedPorts = new Map();
let nextPortId = 0;

// Relay message to currently active tab (or all non-sender tabs)
function relayToActiveTab(msg, senderTabId) {
  if (!msg || !msg.type || !msg.type.startsWith('HANDSFREE_')) return;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (chrome.runtime.lastError || !tabs) return;

    for (const tab of tabs) {
      if (tab.id && tab.id !== senderTabId && tab.url && !tab.url.startsWith('chrome://')) {
        chrome.tabs.sendMessage(tab.id, msg).catch(() => {
          // Tab may not have content script injected (e.g. settings page or newly opened tab)
        });
      }
    }
  });
}

// 1. Direct message from Web App content script bridge
chrome.runtime.onMessage.addListener((msg, sender) => {
  relayToActiveTab(msg, sender?.tab?.id);
});

// 2. Direct external message from Web App via chrome.runtime.sendMessage(extensionId, msg)
if (chrome.runtime.onMessageExternal) {
  chrome.runtime.onMessageExternal.addListener((msg, sender) => {
    relayToActiveTab(msg, sender?.tab?.id);
  });
}

// 3. Persistent Port Connections (Fallback / Long-lived)
chrome.runtime.onConnect.addListener((port) => {
  const portId = nextPortId++;
  connectedPorts.set(portId, port);

  port.onMessage.addListener((msg) => {
    if (!msg || !msg.type || !msg.type.startsWith('HANDSFREE_')) return;

    connectedPorts.forEach((p, id) => {
      if (id !== portId && p.name === 'handsfree-target') {
        try {
          p.postMessage(msg);
        } catch {
          connectedPorts.delete(id);
        }
      }
    });
  });

  port.onDisconnect.addListener(() => {
    connectedPorts.delete(portId);
  });
});
