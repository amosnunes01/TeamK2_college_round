// ============================================================
// Handsfree Content Script — WebSocket Client
// ============================================================

const isHandsfreeApp =
  window.location.href.includes('localhost:5173') ||
  window.location.href.includes('127.0.0.1:5173');

console.log('[Handsfree] Loaded on:', window.location.href, '| isSource:', isHandsfreeApp);

// Only run on Target Tabs (the React app already has its own WS client)
if (!isHandsfreeApp) {
  // Create pointer element
  const pointerEl = document.createElement('div');
  pointerEl.id = 'handsfree-ext-pointer';
  document.body.appendChild(pointerEl);

  let lastScrollY = null;
  let lastX = 0;
  let lastY = 0;

  function updatePointer(x, y, gesture) {
    lastX = x;
    lastY = y;
    pointerEl.style.display = 'block';
    pointerEl.style.left = `${x}px`;
    pointerEl.style.top = `${y}px`;

    if (gesture === 'scroll') {
      pointerEl.classList.add('handsfree-scroll-mode');
      if (lastScrollY !== null) {
        const delta = y - lastScrollY;
        if (Math.abs(delta) > 15) {
          window.scrollBy({ top: delta * 2.5 });
          lastScrollY = y;
        }
      } else {
        lastScrollY = y;
      }
    } else {
      pointerEl.classList.remove('handsfree-scroll-mode');
      lastScrollY = y;
    }
  }

  function performClick() {
    pointerEl.style.display = 'none';
    const el = document.elementFromPoint(lastX, lastY);
    pointerEl.style.display = 'block';
    if (el instanceof HTMLElement) {
      el.click();
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.focus();
    }
  }

  function handleVoice(cmd, text) {
    console.log('[Handsfree TARGET] Voice:', cmd);
    if (cmd === 'scroll down') window.scrollBy({ top: window.innerHeight / 2, behavior: 'smooth' });
    else if (cmd === 'scroll up') window.scrollBy({ top: -window.innerHeight / 2, behavior: 'smooth' });
    else if (cmd === 'scroll to top') window.scrollTo({ top: 0, behavior: 'smooth' });
    else if (cmd === 'scroll to bottom') window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    else if (cmd === 'go back') window.history.back();
    else if (cmd === 'go forward') window.history.forward();
    else if (cmd === 'clear text') {
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        el.value = '';
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    } else if (cmd === 'dictate') {
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        el.value = el.value ? el.value + ' ' + text : text;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  }

  let ws = null;
  
  function connectWs() {
    try {
      ws = new WebSocket('ws://localhost:5174/?role=target');
      
      ws.onopen = () => {
        console.log('[Handsfree TARGET] Connected to WebSocket Bridge');
      };
      
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          
          if (msg.type === 'HANDSFREE_BROADCAST') {
            const { x, y, gesture, isTracking } = msg.payload;
            if (isTracking) {
              updatePointer(x, y, gesture);
            } else {
              pointerEl.style.display = 'none';
              lastScrollY = null;
            }
          } else if (msg.type === 'HANDSFREE_CLICK') {
            performClick();
          } else if (msg.type === 'HANDSFREE_VOICE_COMMAND') {
            handleVoice(msg.command, msg.text);
          } else if (msg.type === 'HANDSFREE_STOP') {
            pointerEl.style.display = 'none';
            lastScrollY = null;
          }
        } catch (e) {
          console.error('[Handsfree TARGET] Bad WS message:', e);
        }
      };
      
      ws.onclose = () => {
        pointerEl.style.display = 'none';
        setTimeout(connectWs, 2000);
      };
      
    } catch (e) {
      setTimeout(connectWs, 2000);
    }
  }

  connectWs();
}
