# Auto Voice Reader for ChatGPT (Jarvis Upgrade)

> **Turn ChatGPT into a dedicated voice assistant with direct audio integration.**

This extension upgrades ChatGPT's voice capabilities by tapping directly into the internal `synthesize` API. Instead of relying on the slow "Read Aloud" button, it fetches high-quality audio directly from OpenAI's servers, offering you instant playback, custom speed control, and a choice of premium voices.

## 🚀 Features

- **⚡ Direct API Audio**: Bypasses the UI to fetch audio directly. Faster and more reliable.
- **🗣️ Premium Voices**: Access all internal voices, including **Ember, Spruce, Breeze, Cove, Arbor, Juniper, Maple, Sol, and Vale**.
- **🎛️ Advanced Control**:
  - **Speed**: Adjustable from **0.5x** to **3.0x**.
  - **Voice**: Switch voices instantly via the floating menu.
- **🎙️ Extension Popup Toggle**: Click the extension icon in the toolbar to quickly enable/disable audio generation globally.
- **🔄 Smart Retry**: Automatically handles API delays to ensure every message is read.

## 🛠️ Installation & Usage

1.  **Install the Extension**.
2.  **Open [chatgpt.com](https://chatgpt.com)**.
3.  **Wait for Load**: The extension quietly captures your session token from your first network request.
    *   *Note: If you see a "No Token" warning, simply refresh the page.*
4.  **Control Audio**:
    *   **Extension Popup**: Click the extension icon to toggle "Enable Audio Generation" on/off.
    *   **On-Screen UI**: Use the floating widget to play/pause, change voices, and adjust speed.
5.  **Chat**: Send a message. The audio will start playing automatically if enabled!

## 🔒 Privacy First

*   **Local Processing**: All logic runs right in your browser.
*   **Token Security**: Your access token is stored locally in `chrome.storage.local` and used **only** to fetch audio from `chatgpt.com`. It is **never** sent to any third-party server.
*   **No External APIs**: The extension only talks to OpenAI's official endpoints.

## 🐞 Troubleshooting

*   **Audio doesn't play?**: Check if the floating icon is **Green** (Active). If it's Grey, click to enable.
*   **"Message not found"?**: The extension has built-in retry logic. Wait 2-3 seconds; audio generation sometimes lags behind text.
*   **Voices missing?**: Reload the extension to update the voice list.

---
*Disclaimer: This is an unofficial extension and is not affiliated with OpenAI.*
