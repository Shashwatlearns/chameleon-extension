// Chameleon - Popup Script
// Matches the current state: Canvas hooked, everything else pending

(function () {
    'use strict';

    // ── DOM references (matching popup.html exactly) ──────────────────────
    const statusIndicator = document.querySelector('.status-indicator');
    const statusStrong    = document.querySelector('.status-text strong');
    const statusPara      = document.querySelector('.status-text p');
    const blockedValue    = document.querySelectorAll('.stat-value')[1]; // second stat

    // Running count of canvas interceptions reported by content.js
    let blockedCount = 0;

    // ── Listen for messages from content.js ───────────────────────────────
    // content.js will send these once messaging is wired up.
    // The listener is ready now so nothing breaks when that step is added.
    chrome.runtime.onMessage.addListener((message) => {
        try {
            if (message.type === 'CHAMELEON_DETECTION') {
                blockedCount++;
                if (blockedValue) {
                    blockedValue.textContent = blockedCount;
                }
            }
        } catch (err) {
            console.error('[Chameleon popup] onMessage error:', err);
        }
    });

    // ── Ask content.js for any detections already logged ─────────────────
    // Works once content.js implements CHAMELEON_GET_STATE response.
    // Silently does nothing if content.js is not ready yet.
    function requestState() {
        try {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (!tabs || tabs.length === 0) return;

                chrome.tabs.sendMessage(
                    tabs[0].id,
                    { type: 'CHAMELEON_GET_STATE' },
                    (response) => {
                        if (chrome.runtime.lastError) return; // not injected yet — fine
                        if (response && Array.isArray(response.detections)) {
                            blockedCount = response.detections.length;
                            if (blockedValue) {
                                blockedValue.textContent = blockedCount;
                            }
                        }
                    }
                );
            });
        } catch (err) {
            console.error('[Chameleon popup] requestState error:', err);
        }
    }

    // ── Init ──────────────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
        requestState();
    });

    // DOMContentLoaded may already have fired (popup scripts load late),
    // so call directly as well.
    requestState();

})();