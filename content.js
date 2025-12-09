// content.js
// "Jarvis" Upgrade: Direct API Audio & Voice Control

(function () {
  'use strict';

  // State
  const STATE = {
    autoRead: true,
    voice: 'vale',
    speed: 1.0,
    currentAudio: null,
    lastMessageCount: 0,
    failedIds: new Set(),
    processingId: null
  };

  // Configuration
  const API_ENDPOINT = "https://chatgpt.com/backend-api/synthesize";
  const VOICES = ['ember', 'spruce', 'breeze', 'cove', 'arbor', 'juniper', 'maple', 'sol', 'vale'];

  // --- UI ---
  function createUI() {
    if (document.getElementById('arc-container')) return;

    const container = document.createElement('div');
    container.id = 'arc-container';
    container.innerHTML = `
        <div id="arc-controls" style="display:none;">
            <select id="arc-voice-select">
                ${VOICES.map(v => `<option value="${v}" ${v === STATE.voice ? 'selected' : ''}>${v}</option>`).join('')}
            </select>
            <input type="range" id="arc-speed" min="0.5" max="3.0" step="0.25" value="${STATE.speed}" title="Speed: ${STATE.speed}x">
            <span id="arc-speed-val">${STATE.speed}x</span>
        </div>
        <button id="arc-fab" title="Toggle Auto-Read">🎙️</button>
      `;

    const style = document.createElement('style');
    style.textContent = `
        #arc-container { position: fixed; bottom: 80px; right: 20px; z-index: 9999; display: flex; flex-direction: column; align-items: flex-end; gap: 10px; font-family: sans-serif; }
        #arc-fab { width: 50px; height: 50px; border-radius: 50%; background: #10a37f; color: white; border: none; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.1); font-size: 24px; transition: transform 0.2s, background 0.2s; }
        #arc-fab:hover { transform: scale(1.1); }
        #arc-fab.off { background: #555; filter: grayscale(1); }
        #arc-fab.playing { box-shadow: 0 0 15px #10a37f; animation: pulse 2s infinite; }
        #arc-controls { background: #202123; padding: 10px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.2); display: flex; gap: 8px; align-items: center; border: 1px solid #444; }
        #arc-voice-select { background: #343541; color: white; border: 1px solid #555; padding: 4px; border-radius: 4px; }
        #arc-speed { width: 80px; }
        #arc-speed-val { color: #ccc; font-size: 12px; width: 30px; }
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(16, 163, 127, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(16, 163, 127, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 163, 127, 0); } }
      `;

    document.head.appendChild(style);
    document.body.appendChild(container);

    const fab = container.querySelector('#arc-fab');
    const controls = container.querySelector('#arc-controls');
    const voiceSel = container.querySelector('#arc-voice-select');
    const speedInput = container.querySelector('#arc-speed');
    const speedVal = container.querySelector('#arc-speed-val');

    fab.addEventListener('click', () => {
      STATE.autoRead = !STATE.autoRead;
      fab.classList.toggle('off', !STATE.autoRead);
      if (!STATE.autoRead && STATE.currentAudio) {
        STATE.currentAudio.pause();
        fab.classList.remove('playing');
      } else if (STATE.autoRead) {
        // Resume context if needed (fix for 'play not allowed')
        const dummy = new Audio();
        dummy.play().catch(() => { });
      }
    });

    container.addEventListener('mouseenter', () => controls.style.display = 'flex');
    container.addEventListener('mouseleave', () => controls.style.display = 'none');
    voiceSel.addEventListener('change', (e) => STATE.voice = e.target.value);
    speedInput.addEventListener('input', (e) => {
      STATE.speed = parseFloat(e.target.value);
      speedVal.textContent = STATE.speed + 'x';
      if (STATE.currentAudio) STATE.currentAudio.playbackRate = STATE.speed;
    });
  }

  // --- Core Logic ---

  async function getStoredData() {
    return chrome.storage.local.get([
      "chatgpt_access_token",
      "oai_client_version",
      "oai_language",
      "oai_device_id"
    ]);
  }

  function getLatestInfo() {
    const match = window.location.pathname.match(/\/c\/([a-z0-9-]+)/);
    const conversationId = match ? match[1] : null; // May be null if new chat

    const messages = document.querySelectorAll('[data-message-author-role="assistant"]');
    if (!messages.length) return null;

    const lastMessage = messages[messages.length - 1];
    const idNode = lastMessage.closest('[data-message-id]');
    const messageId = idNode ? idNode.getAttribute('data-message-id') : null;

    return { conversationId, messageId, element: lastMessage };
  }

  async function playAudio(conversationId, messageId, attempt = 1) {
    if (STATE.failedIds.has(messageId)) return;

    try {
      const data = await getStoredData();
      if (!data.chatgpt_access_token) {
        console.warn("ARC: No token captured yet. Refresh the page.");
        return;
      }

      if (!conversationId) {
        // If we are on a new chat, we might miss the ID. 
        // Rely on URL update? Or don't play initial 'new' chat messages?
        // The API almost certainly needs a conversation ID.
        // Try capturing it from the address bar if it updated recently?
        const match = window.location.pathname.match(/\/c\/([a-z0-9-]+)/);
        if (match) conversationId = match[1];
        else {
          console.log("ARC: No conversation ID found (New Chat?). Skipping.");
          return;
        }
      }

      const url = `${API_ENDPOINT}?message_id=${messageId}&conversation_id=${conversationId}&voice=${STATE.voice}`;

      const headers = {
        'Authorization': data.chatgpt_access_token
      };

      if (data.oai_client_version) headers['OAI-Client-Version'] = data.oai_client_version;
      if (data.oai_language) headers['OAI-Language'] = data.oai_language;
      if (data.oai_device_id) headers['OAI-Device-Id'] = data.oai_device_id; // Prefer captured over cookie

      console.log(`ARC: Fetching audio (Try ${attempt}) for ${messageId}`);

      const response = await fetch(url, { headers });

      if (!response.ok) {
        if (response.status === 404 && attempt < 3) {
          // Retry logic for "Message not found" (Consistency delay)
          console.log(`ARC: 404, retrying in 2.5s...`);
          setTimeout(() => playAudio(conversationId, messageId, attempt + 1), 2500);
          return;
        }
        if (response.status === 404) STATE.failedIds.add(messageId);
        throw new Error(`API Error ${response.status}`);
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);

      if (STATE.currentAudio) {
        STATE.currentAudio.pause();
        STATE.currentAudio = null;
      }

      const audio = new Audio(audioUrl);
      audio.playbackRate = STATE.speed;

      const fab = document.querySelector('#arc-fab');
      if (fab) fab.classList.add('playing');

      audio.onended = () => {
        STATE.currentAudio = null;
        if (fab) fab.classList.remove('playing');
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = (e) => {
        console.error("ARC: Audio playback error", e);
        if (fab) fab.classList.remove('playing');
      };

      // Play handling
      try {
        await audio.play();
        STATE.currentAudio = audio;
      } catch (err) {
        console.warn("ARC: Autoplay blocked. User interaction needed.", err);
        if (fab) fab.classList.remove('playing');
      }

    } catch (e) {
      console.error("ARC: Fetch fail", e);
    }
  }

  // --- Polling ---

  function checkForNewMessages() {
    if (!STATE.autoRead) return;

    const info = getLatestInfo();
    if (!info || !info.messageId) return;

    // Skip placeholders
    if (info.messageId.includes('placeholder')) return;

    // Skip streaming
    const isStreaming = info.element.classList.contains('result-streaming');
    if (isStreaming) return;

    // New Message Check
    if (info.messageId !== STATE.processingId && !STATE.failedIds.has(info.messageId)) {
      STATE.processingId = info.messageId;

      // Initial delay increased to 1.5s to allow backend propagation
      setTimeout(() => {
        playAudio(info.conversationId, info.messageId);
      }, 1500);
    }
  }

  function init() {
    createUI();
    setInterval(checkForNewMessages, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();