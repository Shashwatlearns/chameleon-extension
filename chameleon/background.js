// background.js — Chameleon Service Worker
// Manages dynamic registration of inject.js and the ON/OFF toggle

const INJECT_SCRIPT_ID = 'chameleon-inject';

// Register inject.js as a MAIN-world content script
async function enableProtection() {
    try {
        // Unregister first to avoid "already registered" errors
        await chrome.scripting.unregisterContentScripts({ ids: [INJECT_SCRIPT_ID] });
    } catch (e) { /* not registered yet — fine */ }

    await chrome.scripting.registerContentScripts([{
        id: INJECT_SCRIPT_ID,
        matches: ['<all_urls>'],
        js: ['inject.js'],
        runAt: 'document_start',
        allFrames: true,
        world: 'MAIN'
    }]);

    await chrome.storage.local.set({ enabled: true });
    console.log('[Chameleon] Protection ENABLED');
}

// Unregister inject.js so it stops running on new pages
async function disableProtection() {
    try {
        await chrome.scripting.unregisterContentScripts({ ids: [INJECT_SCRIPT_ID] });
    } catch (e) { /* not registered — fine */ }

    await chrome.storage.local.set({ enabled: false });
    console.log('[Chameleon] Protection DISABLED');
}

// On first install or update, enable protection by default
chrome.runtime.onInstalled.addListener(async () => {
    const { enabled } = await chrome.storage.local.get('enabled');
    if (enabled !== false) {
        await enableProtection();
    }
});

// On browser startup, restore previous state
chrome.runtime.onStartup.addListener(async () => {
    const { enabled } = await chrome.storage.local.get('enabled');
    if (enabled !== false) {
        await enableProtection();
    }
});

// Listen for toggle messages from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'CHAMELEON_TOGGLE') {
        const action = message.enabled ? enableProtection() : disableProtection();
        action.then(() => sendResponse({ success: true, enabled: message.enabled }));
        return true; // keep channel open for async sendResponse
    }

    // Forward detection events (from content.js) — no response needed
    if (message.type === 'CHAMELEON_DETECTION') {
        // broadcast to popup if it's open (popup listens via onMessage)
    }
});
