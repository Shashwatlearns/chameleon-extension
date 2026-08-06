// content.js - Runs in isolated world
// Injects inject.js into the real page world using synchronous inline injection
// and relays detections to the popup via chrome.runtime messaging

(function () {
    'use strict';

    // ── Inject the spoofer into the page's real JS world ─────────────────
    // Use synchronous XHR + inline script to guarantee it runs before ANY page code
    try {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', chrome.runtime.getURL('inject.js'), false); // synchronous
        xhr.send();
        if (xhr.status === 200) {
            const script = document.createElement('script');
            script.textContent = xhr.responseText;
            (document.head || document.documentElement).appendChild(script);
            script.remove();
            console.log('[Chameleon] inject.js injected synchronously into page world');
        }
    } catch (err) {
        console.error('[Chameleon] Failed to inject:', err);
    }

    // ── Detection log for this tab ────────────────────────────────────────
    const _detections = [];

    // Listen for detections dispatched by inject.js via CustomEvent
    window.addEventListener('chameleon_detection', function (e) {
        const detection = { type: e.detail, time: new Date().toLocaleTimeString() };
        _detections.push(detection);
        try {
            chrome.runtime.sendMessage({ type: 'CHAMELEON_DETECTION', detection: detection });
        } catch (err) {}
    });

    // Respond to popup state requests
    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
        if (message.type === 'CHAMELEON_GET_STATE') {
            sendResponse({ detections: _detections });
        }
    });

})();