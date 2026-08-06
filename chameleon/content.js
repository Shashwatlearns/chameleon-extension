// content.js - Runs in isolated world
// Its only job is to inject inject.js into the real page world
// and relay detections to the popup via chrome.runtime messaging

(function () {
    'use strict';

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

    console.log('🦎 Chameleon content.js loaded — inject.js injected into page world');

})();