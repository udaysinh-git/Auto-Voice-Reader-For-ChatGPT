// This extension does not collect, store, or transmit any personal data. All processing happens locally in your browser.
// An accessibility-focused tool that automatically clicks the voice playback button on AI chat interfaces like ChatGPT. Ideal for visually impaired users who rely on screen readers or voice output.
//Features:
// - Automatically activates voice reading when a new message appears
// - ON/OFF toggle for control
// - Lightweight and respectful of user privacy

// /!\ This extension is NOT affiliated with OpenAI or ChatGPT.
(function () {
  'use strict';

  let autoReadActive = true;
  let lastMessageCount = 0;
  let isInitialized = false;
  let pollingInterval = null;

  const CONFIG =
  {
    POLLING_INTERVAL: 500,
    CLICK_DELAY: 100,
    INIT_DELAY: 500,
    LOG_ACTIVE: false
  };

  function logMessage(message) {
    if (CONFIG.LOG_ACTIVE) {
      console.log(message);
    }
  }

  function clickLastReadButton() {
    try {
      // Strategy: Click "More actions" then "Read aloud"
      const moreButtons = Array.from(document.querySelectorAll('button[aria-label="More actions"]'))
        .filter(btn => btn.offsetParent !== null); // Only visible buttons

      if (moreButtons.length > 0 && autoReadActive) {
        const lastMoreButton = moreButtons[moreButtons.length - 1];
        logMessage('ARC clicking "More actions" button (visible index ' + (moreButtons.length - 1) + ')');

        // Scroll into view to ensure clicks work
        lastMoreButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
        lastMoreButton.focus();

        // Enhanced click sequence (Pointer + Mouse) for React compatibility
        const opts = { view: window, bubbles: true, cancelable: true, buttons: 1 };
        lastMoreButton.dispatchEvent(new PointerEvent('pointerdown', opts));
        lastMoreButton.dispatchEvent(new MouseEvent('mousedown', opts));
        lastMoreButton.dispatchEvent(new PointerEvent('pointerup', opts));
        lastMoreButton.dispatchEvent(new MouseEvent('mouseup', opts));
        lastMoreButton.dispatchEvent(new MouseEvent('click', opts));

        setTimeout(() => {
          // Search entire body for "Read aloud" since specific selectors might be failing
          // Using TreeWalker to find text nodes is most robust
          const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
          let node;
          let found = false;

          while (node = walker.nextNode()) {
            if (node.nodeValue && node.nodeValue.includes('Read aloud')) {
              // Found the text, click its parent or closest clickable ancestor
              let target = node.parentElement;

              // Walk up to find the actual menu item role or button
              while (target && target !== document.body) {
                if (target.getAttribute('role') === 'menuitem' || target.tagName === 'BUTTON' || target.className.includes('item')) {
                  break;
                }
                target = target.parentElement;
              }

              if (target) {
                logMessage('ARC clicking "Read aloud" element (via text search)');
                target.click();
                found = true;

                // Close menu (dispatch Escape)
                setTimeout(() => {
                  const esc = new KeyboardEvent('keydown', {
                    key: 'Escape', code: 'Escape', keyCode: 27, which: 27,
                    bubbles: true, cancelable: true, view: window
                  });
                  document.dispatchEvent(esc);
                }, 150);
              } else {
                logMessage('ARC Found "Read aloud" text but no clickable parent');
                node.parentElement.click(); // Try clicking immediate parent as fallback
                found = true;
              }
              break;
            }
          }

          if (!found) {
            logMessage('ARC "Read aloud" text NOT found in document body');
          }
        }, 800);
      }
    } catch (error) {
      console.warn('ARC Error while clicking the read button:', error);
    }
  }


  function checkForNewResponses() {
    try {
      // Track "More actions" buttons as proxy for messages
      const voiceButtons = document.querySelectorAll('button[aria-label="More actions"]');
      const currentMessageCount = voiceButtons.length;

      if (currentMessageCount < lastMessageCount) {
        lastMessageCount = currentMessageCount;
      }

      if (currentMessageCount > lastMessageCount + 1) {
        lastMessageCount = currentMessageCount;
      }

      if (currentMessageCount > lastMessageCount) {
        logMessage(`ARC new response detected (${currentMessageCount} vs ${lastMessageCount})`);
        lastMessageCount = currentMessageCount;

        setTimeout(() => {
          clickLastReadButton();
        }, CONFIG.CLICK_DELAY);
      }
    }
    catch (error) {
      console.warn('ARC Error during response check:', error);
    }
  }

  function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: '10001',
      padding: '10px 20px',
      backgroundColor: '#333',
      color: '#fff',
      borderRadius: '5px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
      fontSize: '14px',
      opacity: '0',
      transition: 'opacity 0.3s ease'
    });
    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => toast.style.opacity = '1', 10);

    // Animate out and remove
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'TOGGLE_AUTO_READ') {
      autoReadActive = !autoReadActive;
      const status = autoReadActive ? 'ON' : 'OFF';
      logMessage(`ARC Auto-read toggled ${status}`);
      showToast(`Auto Read: ${status}`);
    }
  });

  function startPolling() {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    pollingInterval = setInterval(checkForNewResponses, CONFIG.POLLING_INTERVAL);
    logMessage(`ARC Polling started with ${CONFIG.POLLING_INTERVAL}ms interval`);
  }

  function cleanup() {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  }

  function initialize() {
    if (isInitialized) {
      logMessage('ARC Script already initialized, skipping');
      return;
    }

    logMessage('ARC Initializing auto-read script');

    try {
      cleanup();

      setTimeout(() => {
        startPolling();

        const voiceButtons = document.querySelectorAll('button[aria-label="More actions"]');
        lastMessageCount = voiceButtons.length;
        logMessage(`ARC Initial messages detected: ${lastMessageCount}`);

        isInitialized = true;
      }, CONFIG.INIT_DELAY);

    } catch (error) {
      console.error('ARC Initialization error:', error);
    }
  }

  function waitForDOMAndInitialize() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initialize, { once: true });
    }
    else {
      setTimeout(initialize, 1000);
    }
  }

  window.addEventListener('beforeunload', cleanup);

  window.addEventListener('error', function (e) {
    if (e.message && e.message.includes('ARC')) {
      console.warn('ARC Error intercepted:', e.message);
    }
  });

  waitForDOMAndInitialize();

})();