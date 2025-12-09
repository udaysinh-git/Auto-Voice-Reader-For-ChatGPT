// background.js
// Handles extension icon clicks and token capture

// 1. Listen for clicks on the extension icon
chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.sendMessage(tab.id, { action: "TOGGLE_AUTO_READ" })
        .catch(error => {
            console.warn("ARC: Could not send message to tab (maybe content script not loaded?)", error);
        });
});

// 2. Capture Auth Token & Headers
const FILTER = {
    urls: ["https://chatgpt.com/backend-api/*"]
};

const EXTRA_INFO_SPEC = ["requestHeaders"];
if (chrome.webRequest && chrome.webRequest.OnBeforeSendHeadersOptions && chrome.webRequest.OnBeforeSendHeadersOptions.EXTRA_HEADERS) {
    EXTRA_INFO_SPEC.push("extraHeaders");
}

chrome.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
        if (details.requestHeaders) {
            const captured = {};
            let hasNewData = false;

            for (const header of details.requestHeaders) {
                const name = header.name.toLowerCase();

                if (name === "authorization") {
                    captured["chatgpt_access_token"] = header.value;
                    hasNewData = true;
                }
                else if (name === "oai-client-version") {
                    captured["oai_client_version"] = header.value;
                    hasNewData = true;
                }
                else if (name === "oai-language") {
                    captured["oai_language"] = header.value;
                    hasNewData = true;
                }
                else if (name === "oai-device-id") {
                    captured["oai_device_id"] = header.value;
                    hasNewData = true;
                }
            }

            if (hasNewData) {
                chrome.storage.local.set(captured, () => {
                    // console.log("ARC: Captured headers", Object.keys(captured));
                });
            }
        }
    },
    FILTER,
    EXTRA_INFO_SPEC
);
