This extension is not affiliated with OpenAI or ChatGPT.

# Auto Voice Reader For ChatGPT

**Auto Voice Reader** is a lightweight and privacy-friendly browser extension designed to improve accessibility for visually impaired users.

It automatically clicks the "Read Aloud" button whenever a new ChatGPT response appears, allowing screen readers or voice tools to read content out loud without extra user interaction.

---

## 🧩 Features

- 🔊 **Auto Playback**: Automatically clicks "Read Aloud" on new messages.
- 👆 **Click Automation**: Intelligently handles the "More" (...) menu to find the hidden "Read Aloud" button.
- ⏯️ **Toggle Control**: Click the **Extension Icon** in your toolbar to toggle ON/OFF.
- 🍞 **Visual Feedback**: Shows a "Toast" notification when status changes.
- 🔒 **Privacy First**: No data collection, no external API, works entirely locally.

---

## 👀 Who is it for?

- People with **visual impairments**
- Users who prefer **hands-free voice feedback**
- Educators or students using ChatGPT with **audio-based workflows**

---

## 🛠️ How to Install

### 🔥 Firefox (Optimized)
1.  **Download** or Clone this repository.
2.  Open Firefox and go to `about:debugging#/runtime/this-firefox`.
3.  Click **"Load Temporary Add-on..."**.
4.  Select `manifest.json`.
5.  Visit [chatgpt.com](https://chatgpt.com).

### 🟢 Chrome / Edge / Brave
1.  **Download** or Clone this repository.
2.  **Rename File**: Rename `manifest_chrome.json` to `manifest.json` (overwrite the existing one).
    *   *Note: Chrome requires a slightly different configuration than Firefox.*
3.  Open Chrome and go to `chrome://extensions`.
4.  Enable **"Developer mode"**.
5.  Click **"Load unpacked"** and select the folder.

---

## ✅ Permissions

- **Active Tab**: To toggle functionalities via the icon.
- **Scripting/Content**: Only runs on `https://chatgpt.com/*`.
- **No data collection**: All processing is local.

---

## 🙌 Contributions

Feel free to open issues or pull requests for improvements, localization, or compatibility with other platforms.
