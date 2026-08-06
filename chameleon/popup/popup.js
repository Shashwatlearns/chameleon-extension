// Chameleon - Popup Script with Toggle Support

(function () {
    'use strict';

    const statusDot    = document.getElementById('statusDot');
    const statusTitle  = document.getElementById('statusTitle');
    const statusDesc   = document.getElementById('statusDesc');
    const toggleSwitch = document.getElementById('toggleSwitch');
    const blockedValue = document.getElementById('blockedCount');
    const footerStatus = document.getElementById('footerStatus');

    let blockedCount = 0;

    // ── Update UI based on enabled state ─────────────────────────────────
    function updateUI(enabled) {
        if (enabled) {
            statusDot.className = 'status-indicator active';
            statusTitle.textContent = 'Protection Active';
            statusDesc.textContent = 'Fingerprinting APIs are being spoofed';
            footerStatus.textContent = 'Active';
            footerStatus.className = 'status-ok';
            toggleSwitch.checked = true;
        } else {
            statusDot.className = 'status-indicator';
            statusTitle.textContent = 'Protection Disabled';
            statusDesc.textContent = 'Fingerprinting APIs are exposed';
            footerStatus.textContent = 'Disabled';
            footerStatus.className = 'status-off';
            toggleSwitch.checked = false;
        }
    }

    // ── Load current state ───────────────────────────────────────────────
    chrome.storage.local.get('enabled', (result) => {
        const enabled = result.enabled !== false; // default true
        updateUI(enabled);
    });

    // ── Toggle handler ───────────────────────────────────────────────────
    toggleSwitch.addEventListener('change', () => {
        const enabled = toggleSwitch.checked;
        chrome.runtime.sendMessage(
            { type: 'CHAMELEON_TOGGLE', enabled: enabled },
            (response) => {
                if (response && response.success) {
                    updateUI(enabled);
                }
            }
        );
    });

    // ── Listen for detection events from content.js ──────────────────────
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

    // ── Ask content.js for detections already logged ─────────────────────
    function requestState() {
        try {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (!tabs || tabs.length === 0) return;
                chrome.tabs.sendMessage(
                    tabs[0].id,
                    { type: 'CHAMELEON_GET_STATE' },
                    (response) => {
                        if (chrome.runtime.lastError) return;
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

    requestState();

})();