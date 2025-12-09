document.addEventListener('DOMContentLoaded', () => {
    const audioToggle = document.getElementById('audioToggle');
    // Default to true if not set
    chrome.storage.local.get(['audioEnabled'], (result) => {
        if (result.audioEnabled === undefined) {
            audioToggle.checked = true;
            // set default
            chrome.storage.local.set({ audioEnabled: true });
        } else {
            audioToggle.checked = result.audioEnabled;
        }
    });

    audioToggle.addEventListener('change', () => {
        const isEnabled = audioToggle.checked;
        chrome.storage.local.set({ audioEnabled: isEnabled }, () => {
            console.log('Audio enabled set to ' + isEnabled);
        });
    });
});
