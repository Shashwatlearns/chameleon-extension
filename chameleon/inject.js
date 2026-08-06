// inject.js - Runs in the PAGE's JavaScript world
// This is what actually intercepts fingerprinting APIs

(function () {
    'use strict';

    // Signal to the page that Chameleon is active (used by tracker for demo)
    window.__CHAMELEON_ACTIVE__ = true;

    const seed = Math.random();

    function seededRandom(min, max) {
        const x = Math.sin(seed + min + max) * 10000;
        return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
    }

    // ── Canvas ────────────────────────────────────────────────────────────

    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function () {
        const context = this.getContext('2d');
        if (context) {
            const imageData = context.getImageData(0, 0, this.width, this.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                data[i]     += Math.floor(Math.random() * 3) - 1;
                data[i + 1] += Math.floor(Math.random() * 3) - 1;
                data[i + 2] += Math.floor(Math.random() * 3) - 1;
            }
            context.putImageData(imageData, 0, 0);
        }
        window.dispatchEvent(new CustomEvent('chameleon_detection', { detail: 'canvas' }));
        return originalToDataURL.apply(this, arguments);
    };

    const originalToBlob = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function () {
        const context = this.getContext('2d');
        if (context) {
            const imageData = context.getImageData(0, 0, this.width, this.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                data[i]     += Math.floor(Math.random() * 3) - 1;
                data[i + 1] += Math.floor(Math.random() * 3) - 1;
                data[i + 2] += Math.floor(Math.random() * 3) - 1;
            }
            context.putImageData(imageData, 0, 0);
        }
        window.dispatchEvent(new CustomEvent('chameleon_detection', { detail: 'canvas' }));
        return originalToBlob.apply(this, arguments);
    };

    const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
    CanvasRenderingContext2D.prototype.getImageData = function () {
        const imageData = originalGetImageData.apply(this, arguments);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            data[i]     += Math.floor(Math.random() * 3) - 1;
            data[i + 1] += Math.floor(Math.random() * 3) - 1;
            data[i + 2] += Math.floor(Math.random() * 3) - 1;
        }
        window.dispatchEvent(new CustomEvent('chameleon_detection', { detail: 'canvas' }));
        return imageData;
    };

    // ── WebGL ─────────────────────────────────────────────────────────────

    const fakeVendors   = ['Intel Inc.', 'NVIDIA Corporation', 'AMD', 'Google Inc. (Intel)'];
    const fakeRenderers = [
        'Intel Iris OpenGL Engine',
        'ANGLE (Intel, Intel(R) UHD Graphics Direct3D11 vs_5_0 ps_5_0)',
        'ANGLE (NVIDIA, NVIDIA GeForce GTX 1650 Direct3D11 vs_5_0 ps_5_0)',
        'ANGLE (AMD, Radeon RX 580 Series Direct3D11 vs_5_0 ps_5_0)',
        'Mesa DRI Intel(R) HD Graphics 620'
    ];

    const chosenVendor   = fakeVendors[seededRandom(0, fakeVendors.length - 1)];
    const chosenRenderer = fakeRenderers[seededRandom(0, fakeRenderers.length - 1)];

    try {
        const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
        WebGLRenderingContext.prototype.getParameter = function (parameter) {
            try {
                const ext = this.getExtension('WEBGL_debug_renderer_info');
                if (ext) {
                    if (parameter === ext.UNMASKED_VENDOR_WEBGL) {
                        window.dispatchEvent(new CustomEvent('chameleon_detection', { detail: 'webgl' }));
                        return chosenVendor;
                    }
                    if (parameter === ext.UNMASKED_RENDERER_WEBGL) {
                        window.dispatchEvent(new CustomEvent('chameleon_detection', { detail: 'webgl' }));
                        return chosenRenderer;
                    }
                }
            } catch (e) {}
            return originalGetParameter.apply(this, arguments);
        };
    } catch (e) {}

    try {
        const originalGetParameter2 = WebGL2RenderingContext.prototype.getParameter;
        WebGL2RenderingContext.prototype.getParameter = function (parameter) {
            try {
                const ext = this.getExtension('WEBGL_debug_renderer_info');
                if (ext) {
                    if (parameter === ext.UNMASKED_VENDOR_WEBGL) {
                        window.dispatchEvent(new CustomEvent('chameleon_detection', { detail: 'webgl' }));
                        return chosenVendor;
                    }
                    if (parameter === ext.UNMASKED_RENDERER_WEBGL) {
                        window.dispatchEvent(new CustomEvent('chameleon_detection', { detail: 'webgl' }));
                        return chosenRenderer;
                    }
                }
            } catch (e) {}
            return originalGetParameter2.apply(this, arguments);
        };
    } catch (e) {}

    // ── AudioContext ──────────────────────────────────────────────────────

    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            const originalCreateOscillator = AudioContextClass.prototype.createOscillator;
            AudioContextClass.prototype.createOscillator = function () {
                window.dispatchEvent(new CustomEvent('chameleon_detection', { detail: 'audio' }));
                return originalCreateOscillator.apply(this, arguments);
            };

            const originalCreateScriptProcessor = AudioContextClass.prototype.createScriptProcessor;
            AudioContextClass.prototype.createScriptProcessor = function () {
                const processor = originalCreateScriptProcessor.apply(this, arguments);
                processor.addEventListener('audioprocess', function (event) {
                    try {
                        const output = event.outputBuffer;
                        for (let c = 0; c < output.numberOfChannels; c++) {
                            const channelData = output.getChannelData(c);
                            for (let i = 0; i < channelData.length; i++) {
                                channelData[i] += (Math.random() * 0.0001) - 0.00005;
                            }
                        }
                    } catch (e) {}
                });
                return processor;
            };
        }
    } catch (e) {}

    // ── Navigator ─────────────────────────────────────────────────────────

    try {
        const fakeCores    = [2, 4, 4, 8, 8][seededRandom(0, 4)];
        const fakeMemory   = [2, 4, 4, 8][seededRandom(0, 3)];
        const fakePlatform = ['Win32', 'Win32', 'MacIntel', 'Linux x86_64'][seededRandom(0, 3)];

        const overrides = {
            hardwareConcurrency: fakeCores,
            deviceMemory: fakeMemory,
            platform: fakePlatform
        };

        Object.keys(overrides).forEach(function (prop) {
            try {
                Object.defineProperty(navigator, prop, {
                    get: function () {
                        window.dispatchEvent(new CustomEvent('chameleon_detection', { detail: 'navigator' }));
                        return overrides[prop];
                    },
                    configurable: true
                });
            } catch (e) {}
        });
    } catch (e) {}

    // ── WebRTC ────────────────────────────────────────────────────────────

    try {
        const OrigRTC = window.RTCPeerConnection || window.webkitRTCPeerConnection;
        if (OrigRTC) {
            function PatchedRTC(config, constraints) {
                window.dispatchEvent(new CustomEvent('chameleon_detection', { detail: 'webrtc' }));
                return new OrigRTC(config, constraints);
            }
            PatchedRTC.prototype = OrigRTC.prototype;
            Object.setPrototypeOf(PatchedRTC, OrigRTC);
            window.RTCPeerConnection = PatchedRTC;
            window.webkitRTCPeerConnection = PatchedRTC;
        }
    } catch (e) {}

    console.log('[Chameleon] inject.js active — all fingerprinting APIs patched');

})();