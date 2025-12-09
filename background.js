// background.js
// Handles extension icon clicks

chrome.action.onClicked.addListener((tab) => {
    // Send a message to the active tab to toggle the auto-read state
    chrome.tabs.sendMessage(tab.id, { action: "TOGGLE_AUTO_READ" })
        .catch(error => {
            console.warn("ARC: Could not send message to tab (maybe content script not loaded?)", error);
        });
});
