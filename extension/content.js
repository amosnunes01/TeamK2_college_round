// ============================================================
// Handsfree Content Script — Thin Control Bridge
// ============================================================

const isHandsfreeApp =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

// ------------------------------------------------------------
// 1. SOURCE BRIDGE (Runs on Handsfree Web App tab)
// Relays window.postMessage events to background service worker
// ------------------------------------------------------------
if (isHandsfreeApp) {
  window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data || !event.data.type) return;
    if (typeof event.data.type === 'string' && event.data.type.startsWith('HANDSFREE_')) {
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
          chrome.runtime.sendMessage(event.data).catch(() => {});
        }
      } catch {
        // Extension context might be invalid or disconnected
      }
    }
  });
}

// ------------------------------------------------------------
// 2. TARGET CONTROLLER (Runs on all other target webpages)
// Cursor overlay, target element highlighting, scrolling, and clicks
// ------------------------------------------------------------
if (!isHandsfreeApp) {
  // Create virtual cursor element
  const pointerEl = document.createElement('div');
  pointerEl.id = 'handsfree-ext-pointer';
  document.documentElement.appendChild(pointerEl);

  // Create target highlight bounding box element
  const highlightEl = document.createElement('div');
  highlightEl.id = 'handsfree-ext-highlight';
  const badgeEl = document.createElement('div');
  badgeEl.id = 'handsfree-ext-highlight-badge';
  highlightEl.appendChild(badgeEl);
  document.documentElement.appendChild(highlightEl);

  // Tracking & Coordinate state
  let isTracking = false;
  let isPaused = false;
  let currentGesture = 'pointer';
  let lastClientX = window.innerWidth / 2;
  let lastClientY = window.innerHeight / 2;
  let lastScrollY = null;
  let lastClickTime = 0;
  let scrollSensitivity = 5;
  let scrollDeadZone = 15;
  let currentTargetEl = null;

  // Smooth scroll accumulator
  let pendingScrollY = 0;
  let scrollRafId = null;

  function drainScroll() {
    if (Math.abs(pendingScrollY) > 0.5) {
      const step = pendingScrollY * 0.35;
      pendingScrollY -= step;
      window.scrollBy({ top: step, behavior: 'auto' });
      scrollRafId = requestAnimationFrame(drainScroll);
    } else {
      pendingScrollY = 0;
      scrollRafId = null;
    }
  }

  function queueScroll(deltaY) {
    pendingScrollY += deltaY * (scrollSensitivity * 0.4);
    if (scrollRafId === null) {
      scrollRafId = requestAnimationFrame(drainScroll);
    }
  }

  function findInteractiveTarget(el) {
    if (!el) return null;
    return el.closest(
      'button, a, input, textarea, select, [role="button"], [tabindex], summary, [onclick]'
    );
  }

  function updateHighlight(clientX, clientY) {
    if (currentGesture === 'scroll' || !isTracking || isPaused) {
      highlightEl.style.display = 'none';
      currentTargetEl = null;
      return;
    }

    const hit = document.elementFromPoint(clientX, clientY);
    const interactive = findInteractiveTarget(hit);

    if (interactive && interactive instanceof HTMLElement) {
      currentTargetEl = interactive;
      const rect = interactive.getBoundingClientRect();

      highlightEl.style.display = 'block';
      highlightEl.style.top = `${rect.top - 3}px`;
      highlightEl.style.left = `${rect.left - 3}px`;
      highlightEl.style.width = `${rect.width + 6}px`;
      highlightEl.style.height = `${rect.height + 6}px`;

      const label =
        interactive.innerText?.trim()?.slice(0, 20) ||
        interactive.getAttribute('aria-label') ||
        interactive.getAttribute('title') ||
        interactive.tagName.toLowerCase();
      badgeEl.textContent = label;
    } else {
      highlightEl.style.display = 'none';
      currentTargetEl = null;
    }
  }

  function updatePointer(payload) {
    const { normX, normY, x, y, gesture, isTracking: tracking, scrollSensitivity: sens, scrollDeadZone: dead } = payload;

    if (!tracking || isPaused) {
      freezeAndHide();
      return;
    }

    isTracking = true;
    currentGesture = gesture || 'pointer';
    if (sens != null) scrollSensitivity = sens;
    if (dead != null) scrollDeadZone = dead;

    // Viewport-accurate coordinate mapping
    const clientX = normX != null ? normX * window.innerWidth : x;
    const clientY = normY != null ? normY * window.innerHeight : y;

    lastClientX = clientX;
    lastClientY = clientY;

    // Render pointer via GPU transform
    pointerEl.style.display = 'block';
    pointerEl.style.transform = `translate3d(${clientX}px, ${clientY}px, 0) translate(-50%, -50%)`;

    if (currentGesture === 'scroll') {
      pointerEl.classList.add('handsfree-scroll-mode');
      highlightEl.style.display = 'none';

      // Hand scrolling calculation
      if (lastScrollY !== null) {
        const delta = clientY - lastScrollY;
        if (Math.abs(delta) > scrollDeadZone) {
          queueScroll(delta);
          lastScrollY = clientY;
        }
      } else {
        lastScrollY = clientY;
      }
    } else {
      pointerEl.classList.remove('handsfree-scroll-mode');
      lastScrollY = clientY;
      updateHighlight(clientX, clientY);
    }
  }

  function performApprovedClick() {
    // Failure safety: never click if paused, not tracking, in scroll mode, or cooling down
    if (!isTracking || isPaused || currentGesture === 'scroll') {
      return;
    }

    const now = Date.now();
    if (now - lastClickTime < 500) {
      return; // Cooldown duplicate-click protection
    }
    lastClickTime = now;

    const hit = (currentTargetEl && document.body.contains(currentTargetEl))
      ? currentTargetEl
      : document.elementFromPoint(lastClientX, lastClientY);
    const target = findInteractiveTarget(hit) || hit;

    if (target && target instanceof HTMLElement) {
      target.click();

      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        target.focus();
      }

      // Visual feedback
      const originalShadow = target.style.boxShadow;
      target.style.boxShadow = '0 0 0 4px rgba(74, 222, 128, 0.7)';
      setTimeout(() => {
        target.style.boxShadow = originalShadow;
      }, 300);
    }
  }

  function freezeAndHide() {
    isTracking = false;
    lastScrollY = null;
    pendingScrollY = 0;
    if (scrollRafId !== null) {
      cancelAnimationFrame(scrollRafId);
      scrollRafId = null;
    }
    pointerEl.style.display = 'none';
    highlightEl.style.display = 'none';
    currentTargetEl = null;
  }

  function setFocusedTextValue(el, value) {
    const prototype = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
    if (setter) setter.call(el, value);
    else el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function handleVoiceCommand(cmd, text) {
    if (!isTracking || isPaused) return;

    if (cmd === 'scroll down') {
      window.scrollBy({ top: window.innerHeight / 2, behavior: 'smooth' });
    } else if (cmd === 'scroll up') {
      window.scrollBy({ top: -window.innerHeight / 2, behavior: 'smooth' });
    } else if (cmd === 'scroll to top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (cmd === 'scroll to bottom') {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    } else if (cmd === 'go back') {
      window.history.back();
    } else if (cmd === 'go forward') {
      window.history.forward();
    } else if (cmd === 'clear text') {
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        setFocusedTextValue(el, '');
      }
    } else if (cmd === 'dictate') {
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        const start = el.selectionStart ?? el.value.length;
        const end = el.selectionEnd ?? start;
        const content = (text || '').trim();
        const prefix = el.value.slice(0, start);
        const separator = prefix && !/\s$/.test(prefix) && !/^[,.;:!?)]/.test(content) ? ' ' : '';
        const insertion = `${separator}${content}`;
        setFocusedTextValue(el, `${el.value.slice(0, start)}${insertion}${el.value.slice(end)}`);
        try {
          const caret = start + insertion.length;
          el.setSelectionRange(caret, caret);
        } catch {}
      }
    }
  }

  function handleMessage(msg) {
    if (!msg || !msg.type) return;

    switch (msg.type) {
      case 'HANDSFREE_BROADCAST':
        if (msg.payload) updatePointer(msg.payload);
        break;

      case 'HANDSFREE_CLICK':
        performApprovedClick();
        break;

      case 'HANDSFREE_VOICE_COMMAND':
        handleVoiceCommand(msg.command, msg.text);
        break;

      case 'HANDSFREE_PAUSE':
        isPaused = true;
        freezeAndHide();
        pointerEl.classList.add('handsfree-paused');
        break;

      case 'HANDSFREE_RESUME':
        isPaused = false;
        lastClickTime = Date.now();
        lastScrollY = null;
        pendingScrollY = 0;
        pointerEl.classList.remove('handsfree-paused');
        break;

      case 'HANDSFREE_STOP':
        freezeAndHide();
        break;
    }
  }

  // Channel 1: Native Chrome Extension Messaging
  if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((msg) => {
      handleMessage(msg);
    });
  }

  // Channel 2: WebSocket Dev Bridge Fallback
  let ws = null;
  function connectWs() {
    try {
      ws = new WebSocket('ws://localhost:5187/?role=target');

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          handleMessage(msg);
        } catch {}
      };

      ws.onclose = () => {
        setTimeout(connectWs, 2000);
      };

      ws.onerror = () => {
        ws?.close();
      };
    } catch {
      setTimeout(connectWs, 2000);
    }
  }

  connectWs();

  // Clean teardown on page unload
  window.addEventListener('unload', () => {
    pointerEl.remove();
    highlightEl.remove();
    ws?.close();
  });
}
