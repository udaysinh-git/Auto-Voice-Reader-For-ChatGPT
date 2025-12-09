// content.js
// "Jarvis" Pro: Premium UI, Visualizer, & Direct API Audio

(function () {
  'use strict';

  // --- State & Config ---
  const STATE = {
    autoRead: true,
    voice: 'vale',
    speed: 1.0,
    isExpanded: true, // Start expanded to show off controls
    isPlaying: false,
    audioCtx: null,
    analyser: null,
    dataArray: null,
    source: null,
    animationId: null,
    currentAudio: null,
    failedIds: new Set(),
    processingId: null
  };

  const API_ENDPOINT = "https://chatgpt.com/backend-api/synthesize";
  const VOICES = ['ember', 'spruce', 'breeze', 'cove', 'arbor', 'juniper', 'maple', 'sol', 'vale'];

  // --- HTML & CSS ---
  const STYLES = `
        /* Font logic */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');

        #arc-widget {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            position: fixed !important;
            bottom: 30px !important;
            right: 30px !important;
            z-index: 9999999 !important;
            display: flex !important;
            flex-direction: column;
            align-items: flex-end;
            pointer-events: none;
        }

        /* --- Floating Action Button --- */
        #arc-fab {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: #10a37f; /* Solid fallback */
            background: rgba(16, 163, 127, 0.9);
            color: white;
            border: 2px solid white; /* Distinct border */
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: auto;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        }

        /* --- Main Panel (Expanded) --- */
        #arc-panel {
            pointer-events: auto;
            width: 320px;
            background: #202123; /* Solid fallback */
            background: rgba(32, 33, 35, 0.95);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 16px;
            padding: 16px;
            margin-bottom: 16px;
            color: white;
            opacity: 0;
            transform: translateY(10px);
            transition: opacity 0.3s, transform 0.3s;
            display: flex;
            flex-direction: column;
            gap: 12px;
            visibility: hidden;
            box-shadow: 0 10px 40px rgba(0,0,0,0.6);
        }

        #arc-panel.visible {
            opacity: 1 !important;
            transform: translateY(0) !important;
            visibility: visible !important;
            display: flex !important;
        }

        /* Header */
        #arc-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: grab;
            padding-bottom: 12px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            user-select: none;
        }
        #arc-header h3 { margin: 0; font-size: 14px; font-weight: 600; letter-spacing: 0.5px; color: #fff; display:flex; align-items:center; gap:8px;}
        #arc-minimize { background: none; border: none; color: #aaa; cursor: pointer; padding: 4px; border-radius: 50%; transition: 0.2s; }
        #arc-minimize:hover { background: rgba(255,255,255,0.1); color: white; }

        /* Visualizer */
        #arc-visualizer-container {
            height: 64px;
            background: rgba(0,0,0,0.3);
            border-radius: 12px;
            position: relative;
            overflow: hidden;
            border: 1px solid rgba(255,255,255,0.05);
        }
        canvas#arc-canvas { width: 100%; height: 100%; }

        /* Controls */
        #arc-controls-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
        
        .arc-btn {
            background: rgba(255,255,255,0.08);
            border: none;
            border-radius: 12px;
            color: #ddd;
            height: 40px;
            width: 48px;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .arc-btn:hover { background: rgba(255,255,255,0.15); color: white; transform: translateY(-1px); }
        .arc-btn:active { transform: translateY(0); }
        
        #arc-play-pause {
            width: 100%;
            background: #10a37f;
            color: white;
            box-shadow: 0 4px 12px rgba(16, 163, 127, 0.3);
        }
        #arc-play-pause:hover { background: #0d8a6a; }

        /* Settings */
        #arc-settings { display: grid; grid-template-columns: 2fr 1fr; gap: 12px; align-items: center;}
        
        #arc-voice-select {
            width: 100%;
            background: rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.1);
            color: #eee;
            border-radius: 8px;
            padding: 8px 12px;
            font-size: 13px;
            outline: none;
            cursor: pointer;
            appearance: none;
        }
        #arc-voice-select:hover { border-color: rgba(255,255,255,0.3); }

        #arc-speed-display {
            font-family: monospace;
            font-size: 12px;
            color: #aaa;
            text-align: right;
            padding-right: 4px;
        }
        
        @keyframes pulse-ring {
            0% { box-shadow: 0 0 0 0 rgba(16, 163, 127, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(16, 163, 127, 0); }
            100% { box-shadow: 0 0 0 0 rgba(16, 163, 127, 0); }
        }
    `;

  // New "Atom/Core" Icon for Jarvis
  const JARVIS_ICON = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.1 1.1 0 0 0 .3 1.7A10.3 10.3 0 0 1 12 21a10.3 10.3 0 0 1-7.7-4.3 1.1 1.1 0 0 0 .3-1.7"></path>
            <path d="M4.6 9a1.1 1.1 0 0 0-.3-1.7A10.3 10.3 0 0 1 12 3a10.3 10.3 0 0 1 7.7 4.3 1.1 1.1 0 0 0-.3 1.7"></path>
        </svg>
    `;

  const HTML = `
        <!-- Main Expanded Panel -->
        <div id="arc-panel" class="visible">
            <div id="arc-header">
                <h3>${JARVIS_ICON.replace('width="24"', 'width="18"').replace('height="24"', 'height="18"')} &nbsp; JARVIS</h3>
                <button id="arc-minimize" title="Minimize">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
            
            <div id="arc-visualizer-container">
                <canvas id="arc-canvas"></canvas>
            </div>

            <div id="arc-controls-row">
                <button id="arc-prev-speed" class="arc-btn" title="Slower (-0.25x)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2V15H6L11 19V5Z"></path><path d="M15.54 8.46L19.07 12L15.54 15.54"></path></svg>
                </button>
                <div style="flex:1">
                    <button id="arc-play-pause" class="arc-btn" title="Play/Pause">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    </button>
                </div>
                <button id="arc-next-speed" class="arc-btn" title="Faster (+0.25x)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2V15H6L11 19V5Z"></path><path d="M19.07 15.54L15.54 12L19.07 8.46"></path></svg>
                </button>
            </div>

            <div id="arc-settings">
                <select id="arc-voice-select" title="Voice Selection">
                     ${VOICES.map(v => `<option value="${v}">${v.charAt(0).toUpperCase() + v.slice(1)}</option>`).join('')}
                </select>
                <span id="arc-speed-display">1.00x</span>
            </div>
        </div>

        <!-- Floating Button -->
        <button id="arc-fab" title="Open Jarvis" style="display:none;">
            ${JARVIS_ICON}
        </button>
    `;

  function createUI() {
    if (document.getElementById('arc-widget')) return;

    const wrapper = document.createElement('div');
    wrapper.id = 'arc-widget';
    wrapper.innerHTML = HTML;

    const style = document.createElement('style');
    style.textContent = STYLES;
    document.head.appendChild(style);

    document.body.appendChild(wrapper);

    bindEvents(wrapper);
    dragElement(wrapper);
  }

  function bindEvents(wrapper) {
    const fab = wrapper.querySelector('#arc-fab');
    const panel = wrapper.querySelector('#arc-panel');
    const minimize = wrapper.querySelector('#arc-minimize');
    const playPause = wrapper.querySelector('#arc-play-pause');
    const voiceSel = wrapper.querySelector('#arc-voice-select');
    const speedPrev = wrapper.querySelector('#arc-prev-speed');
    const speedNext = wrapper.querySelector('#arc-next-speed');

    const togglePanel = () => {
      STATE.isExpanded = !STATE.isExpanded;
      if (STATE.isExpanded) {
        panel.classList.add('visible');
        fab.style.display = 'none';
      } else {
        panel.classList.remove('visible');
        fab.style.display = 'flex';
      }
    };

    fab.addEventListener('click', () => {
      if (STATE.audioCtx && STATE.audioCtx.state === 'suspended') STATE.audioCtx.resume();
      togglePanel();
    });

    minimize.addEventListener('click', togglePanel);

    playPause.addEventListener('click', () => {
      if (STATE.currentAudio) {
        if (STATE.currentAudio.paused) {
          STATE.currentAudio.play();
          STATE.isPlaying = true;
        } else {
          STATE.currentAudio.pause();
          STATE.isPlaying = false;
        }
        updatePlayButton(STATE.isPlaying);
      } else {
        // If no audio, maybe toggle auto-read?
        STATE.autoRead = !STATE.autoRead;
        // Visual feedback?
      }
    });

    voiceSel.addEventListener('change', (e) => {
      STATE.voice = e.target.value;
    });

    speedPrev.addEventListener('click', () => updateSpeed(-0.25));
    speedNext.addEventListener('click', () => updateSpeed(0.25));
  }

  function updateSpeed(delta) {
    STATE.speed = Math.max(0.25, Math.min(3.0, STATE.speed + delta));
    document.getElementById('arc-speed-display').textContent = STATE.speed.toFixed(2) + 'x';
    if (STATE.currentAudio) STATE.currentAudio.playbackRate = STATE.speed;
  }

  function updatePlayButton(playing) {
    const btn = document.getElementById('arc-play-pause');
    if (playing) {
      btn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="10" y1="4" x2="10" y2="20"></line><line x1="14" y1="4" x2="14" y2="20"></line></svg>`;
      btn.style.background = '#e23d28'; // Red for pause/stop
    } else {
      btn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
      btn.style.background = '#10a37f'; // Green for play
    }
  }

  function dragElement(elmnt) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const header = document.getElementById('arc-header');

    if (header) {
      header.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;

      // Allow dragging anywhere with !important override
      elmnt.style.setProperty('top', (elmnt.offsetTop - pos2) + "px", 'important');
      elmnt.style.setProperty('left', (elmnt.offsetLeft - pos1) + "px", 'important');
      elmnt.style.setProperty('bottom', 'auto', 'important');
      elmnt.style.setProperty('right', 'auto', 'important');
    }

    function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }

  // --- Audio & Visualizer Logic ---

  function initAudioContext() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      STATE.audioCtx = new AudioContext();
      STATE.analyser = STATE.audioCtx.createAnalyser();
      STATE.analyser.fftSize = 64; // Smaller FFT for smoother, chunkier bars
      const bufferLength = STATE.analyser.frequencyBinCount;
      STATE.dataArray = new Uint8Array(bufferLength);
    } catch (e) {
      console.warn("ARC: Web Audio API not supported", e);
    }
  }

  function drawVisualizer() {
    if (!STATE.analyser) return;
    const canvas = document.getElementById("arc-canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    STATE.animationId = requestAnimationFrame(drawVisualizer);
    STATE.analyser.getByteFrequencyData(STATE.dataArray);

    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    const barWidth = (WIDTH / STATE.dataArray.length) * 1.5;
    let x = 0;

    // Gradient for bars
    const gradient = ctx.createLinearGradient(0, 0, WIDTH, 0);
    gradient.addColorStop(0, '#10a37f');
    gradient.addColorStop(1, '#0d8a6a');

    for (let i = 0; i < STATE.dataArray.length; i++) {
      const v = STATE.dataArray[i];
      const barHeight = (v / 255) * HEIGHT * 0.8;

      const r = 16 + (v / 2); // Dynamic color
      const g = 163;
      const b = 127 + (v / 2);

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.8)`;

      // Center the bars vertically
      const y = (HEIGHT - barHeight) / 2;

      // Rounded caps
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth - 2, barHeight, 4);
      ctx.fill();

      x += barWidth;
    }
  }

  // --- Playback Logic ---

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
    const conversationId = match ? match[1] : null;
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
      if (!data.chatgpt_access_token) return;

      const url = `${API_ENDPOINT}?message_id=${messageId}&conversation_id=${conversationId}&voice=${STATE.voice}`;
      const headers = { 'Authorization': data.chatgpt_access_token };
      if (data.oai_client_version) headers['OAI-Client-Version'] = data.oai_client_version;
      if (data.oai_language) headers['OAI-Language'] = data.oai_language;
      if (data.oai_device_id) headers['OAI-Device-Id'] = data.oai_device_id;

      console.log(`ARC: Fetching audio for ${messageId}`);

      const response = await fetch(url, { headers });

      if (!response.ok) {
        if (response.status === 404 && attempt < 3) {
          setTimeout(() => playAudio(conversationId, messageId, attempt + 1), 2500);
          return;
        }
        if (response.status === 404) STATE.failedIds.add(messageId);
        throw new Error(`API Error ${response.status} `);
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);

      if (STATE.currentAudio) {
        STATE.currentAudio.pause();
        STATE.currentAudio = null;
        if (STATE.animationId) cancelAnimationFrame(STATE.animationId);
      }

      const audio = new Audio(audioUrl);
      audio.crossOrigin = "anonymous";
      audio.playbackRate = STATE.speed;

      if (STATE.audioCtx) {
        if (STATE.source) { STATE.source.disconnect(); }
        STATE.source = STATE.audioCtx.createMediaElementSource(audio);
        STATE.source.connect(STATE.analyser);
        STATE.analyser.connect(STATE.audioCtx.destination);
        drawVisualizer();
      }

      audio.onended = () => {
        STATE.currentAudio = null;
        STATE.isPlaying = false;
        updatePlayButton(false);
        URL.revokeObjectURL(audioUrl);
        if (STATE.animationId) cancelAnimationFrame(STATE.animationId);
      };

      try {
        await audio.play();
        STATE.currentAudio = audio;
        STATE.isPlaying = true;
        updatePlayButton(true);
      } catch (err) {
        console.warn("ARC: Autoplay blocked.", err);
      }

    } catch (e) {
      console.error("ARC: Fetch fail", e);
    }
  }

  function checkForNewMessages() {
    if (!STATE.autoRead) return;
    const info = getLatestInfo();
    if (!info || !info.messageId || info.messageId.includes('placeholder')) return;
    if (info.element.classList.contains('result-streaming')) return;

    if (info.messageId !== STATE.processingId && !STATE.failedIds.has(info.messageId)) {
      STATE.processingId = info.messageId;
      setTimeout(() => playAudio(info.conversationId, info.messageId), 1500);
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