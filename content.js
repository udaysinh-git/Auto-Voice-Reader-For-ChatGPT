// content.js
// V-READER: Neo-Brutalist Audio Reader for ChatGPT

(function () {
  'use strict';

  // --- State & Config ---
  const STATE = {
    autoRead: true,
    voice: 'vale',
    speed: 1.0,
    isExpanded: true,
    isPlaying: false,
    theme: 'light',
    currentAudio: null,
    lastConvId: null,
    lastMsgId: null,
    failedIds: new Set(),
    processingId: null
  };

  const API_ENDPOINT = "https://chatgpt.com/backend-api/synthesize";
  const VOICES = ['breeze', 'cove', 'arbor', 'juniper', 'maple', 'sol', 'vale'];
  const SPEEDS = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

  // --- HTML & CSS ---
  /* --- HTML & CSS --- */
  const STYLES = `
        /* Font logic */
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');

        #arc-widget {
            font-family: 'JetBrains Mono', monospace;
            /* Theme Variables (Light Default) */
            --arc-bg: #ffffff;
            --arc-txt: #000000;
            --arc-border: #000000;
            --arc-shadow: #000000;
            --arc-accent: #00ff9d; /* Green */
            --arc-accent-txt: #000000;

            position: fixed !important;
            bottom: 30px !important;
            right: 30px !important;
            z-index: 9999999 !important;
            display: flex !important;
            flex-direction: column;
            align-items: flex-end;
            pointer-events: none;
        }

        /* Dark Mode Overrides */
        #arc-widget.dark-mode {
            --arc-bg: #000000;
            --arc-txt: #ffffff;
            --arc-border: #ffffff;
            --arc-shadow: rgba(255, 255, 255, 0.8);
            /* Keep accent as green or maybe adjust? Green pops on black too. */
        }

        /* --- Floating Action Button --- */
        #arc-fab {
            width: 50px;
            height: 50px;
            background: var(--arc-bg);
            color: var(--arc-txt);
            border: 3px solid var(--arc-border);
            box-shadow: 4px 4px 0px var(--arc-shadow);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: auto;
            transition: all 0.1s;
        }
        #arc-fab:active { transform: translate(2px, 2px); box-shadow: 2px 2px 0px var(--arc-shadow); }

        /* --- Main Panel (Expanded) --- */
        #arc-panel {
            pointer-events: auto;
            width: 300px;
            background: var(--arc-bg);
            border: 3px solid var(--arc-border);
            box-shadow: 8px 8px 0px var(--arc-shadow);
            padding: 16px;
            margin-bottom: 16px;
            color: var(--arc-txt);
            display: flex;
            flex-direction: column;
            gap: 16px;
            opacity: 0;
            transform: translateY(10px);
            visibility: hidden;
            transition: opacity 0.2s, transform 0.2s;
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
            justify-content: flex-end; /* Align items to right (minimal) */
            align-items: center;
            cursor: grab;
            user-select: none;
            /* Remove border-bottom or keep? User said "remove branding". 
               Let's keep the border for structure but minimal. */
            border-bottom: 3px solid var(--arc-border);
            padding-bottom: 8px;
            margin-bottom: 8px;
            height: 32px; /* Ensure drag area exists even if empty on left */
        }
        /* Removed h3 styling */
        
        .arc-icon-btn { background: none; border: none; color: var(--arc-txt); cursor: pointer; padding: 4px; display:flex; align-items:center; justify-content:center;}
        .arc-icon-btn:hover { transform: scale(1.1); }
        .arc-icon-btn svg { width: 18px; height: 18px; }

        /* Controls */
        #arc-controls-wrapper { display: flex; flex-direction: column; gap: 12px; width: 100%; }
        
        #arc-progress-container { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; }
        #arc-time-current, #arc-time-total { min-width: 36px; text-align: center; }
        
        /* Brutalist Slider */
        .arc-slider {
            -webkit-appearance: none;
            width: 100%;
            height: 12px;
            background: var(--arc-bg);
            border: 2px solid var(--arc-border);
            outline: none;
            cursor: pointer;
        }
        .arc-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 12px;
            height: 12px;
            background: var(--arc-txt);
            cursor: pointer;
            box-shadow: none;
            border: none;
        }

        #arc-main-controls { display: flex; align-items: center; gap: 12px; }
        
        .arc-btn {
            background: var(--arc-bg);
            border: 3px solid var(--arc-border);
            color: var(--arc-txt);
            height: 48px;
            width: 48px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 3px 3px 0px var(--arc-shadow);
            transition: all 0.1s;
        }
        .arc-btn:active { transform: translate(2px, 2px); box-shadow: 1px 1px 0px var(--arc-shadow); }
        
        #arc-play-pause {
            background: var(--arc-accent);
            color: var(--arc-accent-txt);
            width: 100%;
            flex: 1;
        }

        /* Selects */
        .arc-select {
            width: 100%;
            background: var(--arc-bg);
            border: 3px solid var(--arc-border);
            color: var(--arc-txt);
            padding: 8px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            font-weight: 700;
            outline: none;
            cursor: pointer;
            appearance: none;
            box-shadow: 3px 3px 0px var(--arc-shadow);
        }
        .arc-select:active { transform: translate(2px, 2px); box-shadow: 1px 1px 0px var(--arc-shadow); }
        
        #arc-settings { display: grid; grid-template-columns: 2fr 1fr; gap: 12px; }

    `;

  const ICON_READER = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square" stroke-linejoin="miter">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
        </svg>
    `;

  const HTML = `
        <!-- Main Expanded Panel -->
        <div id="arc-panel" class="visible">
            <div id="arc-header">
               <!-- Minimal Header: No Title -->
                <div style="display:flex; gap:8px; align-items:center;">
                    <button id="arc-theme-toggle" class="arc-icon-btn" title="Toggle Theme">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                           <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                        </svg>
                    </button>
                    <button id="arc-minimize" class="arc-icon-btn" title="Minimize">_</button>
                </div>
            </div>
            
            <div id="arc-controls-wrapper">
                <!-- Progress Bar -->
                <div id="arc-progress-container">
                    <span id="arc-time-current">0:00</span>
                    <input type="range" id="arc-progress" class="arc-slider" value="0" min="0" max="100" step="0.1">
                    <span id="arc-time-total">0:00</span>
                </div>

                <div id="arc-main-controls">
                     <button id="arc-replay" class="arc-btn" title="Replay">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
                     </button>
                     <button id="arc-play-pause" class="arc-btn" style="flex:2;" title="Play/Pause">PLAY</button>
                     <button id="arc-download" class="arc-btn" title="Download">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                     </button>
                </div>
            </div>

            <div id="arc-settings">
                <select id="arc-voice-select" class="arc-select" title="Voice">
                     ${VOICES.map(v => `<option value="${v}">VOICE: ${v.toUpperCase()}</option>`).join('')}
                </select>
                <select id="arc-speed-select" class="arc-select" title="Speed">
                    ${SPEEDS.map(s => `<option value="${s}" ${s === 1.0 ? 'selected' : ''}>${s}x</option>`).join('')}
                </select>
            </div>
        </div>

        <!-- Floating Button -->
        <button id="arc-fab" title="Open Reader" style="display:none;">
            ${ICON_READER.replace('width="24"', 'width="20"').replace('height="24"', 'height="20"')}
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
    bindKeys();
    dragElement(wrapper);
  }

  function bindKeys() {
    document.addEventListener('keydown', (e) => {
      // Ignore if typing in an input/textarea
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.target.isContentEditable) return;

      switch (e.key) {
        case ' ': // Toggle Play/Pause
          e.preventDefault();
          const playBtn = document.getElementById('arc-play-pause');
          if (playBtn) playBtn.click();
          break;
        case 'ArrowLeft': // Seek -5s
          if (STATE.currentAudio) {
            STATE.currentAudio.currentTime = Math.max(0, STATE.currentAudio.currentTime - 5);
          }
          break;
        case 'ArrowRight': // Seek +5s
          if (STATE.currentAudio) {
            STATE.currentAudio.currentTime = Math.min(STATE.currentAudio.duration, STATE.currentAudio.currentTime + 5);
          }
          break;
        case '[': // Speed Down
          updateSpeed(-0.25);
          break;
        case ']': // Speed Up
          updateSpeed(0.25);
          break;
        case 'Escape': // Toggle minimize/expand
          const fab = document.getElementById('arc-fab');
          if (STATE.isExpanded) {
            const minBtn = document.getElementById('arc-minimize');
            if (minBtn) minBtn.click();
          } else if (fab) {
            fab.click();
          }
          break;
      }
    });
  }

  function updateSpeed(change) {
    const sel = document.getElementById('arc-speed-select');
    if (!sel) return;

    let current = parseFloat(sel.value);
    let newVal = current + change;

    // Clamp between 0.25 and 2.0
    if (newVal < 0.25) newVal = 0.25;
    if (newVal > 2.0) newVal = 2.0;

    // Select the nearest option to ensure validity (though logic above matches options)
    sel.value = newVal;
    sel.dispatchEvent(new Event('change'));
  }

  function bindEvents(wrapper) {
    const fab = wrapper.querySelector('#arc-fab');
    const panel = wrapper.querySelector('#arc-panel');
    const minimize = wrapper.querySelector('#arc-minimize');
    const themeToggle = wrapper.querySelector('#arc-theme-toggle');
    const playPause = wrapper.querySelector('#arc-play-pause');
    const replayBtn = wrapper.querySelector('#arc-replay');
    const downloadBtn = wrapper.querySelector('#arc-download');
    const voiceSel = wrapper.querySelector('#arc-voice-select');
    const speedSel = wrapper.querySelector('#arc-speed-select');
    const progressSlider = wrapper.querySelector('#arc-progress');

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

    fab.addEventListener('click', togglePanel);
    minimize.addEventListener('click', togglePanel);

    themeToggle.addEventListener('click', () => {
      STATE.theme = STATE.theme === 'light' ? 'dark' : 'light';
      const widget = document.getElementById('arc-widget');

      if (STATE.theme === 'dark') {
        widget.classList.add('dark-mode');
        themeToggle.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
      } else {
        widget.classList.remove('dark-mode');
        themeToggle.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
      }
    });

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
        STATE.autoRead = !STATE.autoRead;
        chrome.storage.local.set({ audioEnabled: STATE.autoRead });
        console.log("ARC: Toggled autoRead to", STATE.autoRead);
      }
    });

    replayBtn.addEventListener('click', () => {
      if (STATE.currentAudio) {
        STATE.currentAudio.currentTime = 0;
        STATE.currentAudio.play();
        STATE.isPlaying = true;
        updatePlayButton(true);
      }
    });

    downloadBtn.addEventListener('click', () => {
      if (STATE.currentAudio && STATE.currentAudio.src) {
        const a = document.createElement('a');
        a.href = STATE.currentAudio.src;
        a.download = `voice-reader-${Date.now()}.mp3`;
        // Attempt to name properly if possible, but minimal dependency
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        alert("No audio loaded to download.");
      }
    });

    speedSel.addEventListener('change', (e) => {
      const val = parseFloat(e.target.value);
      STATE.speed = val;
      if (STATE.currentAudio) STATE.currentAudio.playbackRate = val;
    });

    voiceSel.addEventListener('change', (e) => {
      STATE.voice = e.target.value;
      if (STATE.currentAudio) {
        const wasPlaying = !STATE.currentAudio.paused;
        STATE.currentAudio.pause();
        STATE.currentAudio = null;
        if (wasPlaying && STATE.lastMsgId && STATE.lastConvId) {
          playAudio(STATE.lastConvId, STATE.lastMsgId);
        }
      }
    });

    progressSlider.addEventListener('input', (e) => {
      if (STATE.currentAudio) {
        const pct = parseFloat(e.target.value);
        const time = (pct / 100) * STATE.currentAudio.duration;
        STATE.currentAudio.currentTime = time;
      }
    });
  }

  function formatTime(seconds) {
    if (!seconds) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function updatePlayButton(playing) {
    const btn = document.getElementById('arc-play-pause');
    if (playing) {
      btn.textContent = "PAUSE";
      btn.style.background = "#ff5c5c"; // Red
      btn.style.color = "#000";
    } else {
      btn.textContent = "PLAY";
      btn.style.background = "#00ff9d"; // Green
      btn.style.color = "#000";
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
      }

      STATE.lastConvId = conversationId;
      STATE.lastMsgId = messageId;

      const audio = new Audio(audioUrl);
      audio.crossOrigin = "anonymous";
      audio.playbackRate = STATE.speed;

      // Hook up timeupdate for progress bar
      audio.addEventListener('timeupdate', () => {
        if (!audio.duration) return;
        const pct = (audio.currentTime / audio.duration) * 100;
        const prog = document.getElementById('arc-progress');
        const curr = document.getElementById('arc-time-current');
        const tot = document.getElementById('arc-time-total');

        if (prog) prog.value = pct;
        if (curr) curr.textContent = formatTime(audio.currentTime);
        if (tot) tot.textContent = formatTime(audio.duration);
      });

      audio.onended = () => {
        STATE.currentAudio = null;
        STATE.isPlaying = false;
        updatePlayButton(false);
        URL.revokeObjectURL(audioUrl);
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

    // Load Auto-Read setting
    chrome.storage.local.get(['audioEnabled'], (result) => {
      if (result.audioEnabled !== undefined) {
        STATE.autoRead = result.audioEnabled;
        console.log("ARC: Loaded audioEnabled =", STATE.autoRead);
      }
    });

    // Listen for changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local' && changes.audioEnabled) {
        STATE.autoRead = changes.audioEnabled.newValue;
        console.log("ARC: Auto-read updated to", STATE.autoRead);
      }
    });

    setInterval(checkForNewMessages, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();