// Chameleon Tracker - Fingerprint Collection Script
// This collects browser fingerprinting data and generates a unique SHA-256 hash

let fingerprintData = {};
let fingerprintHash = '';

// Collect all fingerprint data on page load
window.addEventListener('DOMContentLoaded', async () => {
    try {
        // Wait 500ms to guarantee the extension has fully injected and patched the APIs
        await new Promise(resolve => setTimeout(resolve, 500));

        // Check if Chameleon extension is active
        const chameleonActive = window.__CHAMELEON_ACTIVE__ === true;
        const statusEl = document.getElementById('status');
        if (chameleonActive) {
            statusEl.textContent = 'Chameleon Active — fingerprint will be spoofed';
            statusEl.className = 'status complete';
        } else {
            statusEl.textContent = 'Chameleon Not Detected — real fingerprint exposed';
            statusEl.className = 'status collecting';
        }

        await collectFingerprint();
        displayFingerprint();
        document.getElementById('sendBtn').disabled = false;
    } catch (error) {
        console.error('Error collecting fingerprint:', error);
        document.getElementById('status').textContent = 'Error collecting fingerprint';
        document.getElementById('status').className = 'status error';
    }
});

// Main fingerprint collection function
async function collectFingerprint() {
    fingerprintData = {
        canvas: await getCanvasFingerprint(),
        webgl: getWebGLFingerprint(),
        audio: await getAudioFingerprint(),
        fonts: getFontFingerprint(),
        screen: getScreenFingerprint(),
        navigator: getNavigatorFingerprint(),
        timezone: getTimezoneFingerprint(),
        plugins: getPluginsFingerprint(),
        touch: getTouchFingerprint(),
        doNotTrack: getDoNotTrack(),
        cookies: getCookiesEnabled()
    };

    // Generate SHA-256 hash from all collected data
    const dataString = JSON.stringify(fingerprintData);
    fingerprintHash = await generateHash(dataString);
}

// Canvas fingerprinting - GPU renders text/shapes with unique variations
async function getCanvasFingerprint() {
    try {
        const canvas = document.createElement('canvas');
            canvas.width = 300;
            canvas.height = 80;
        const ctx = canvas.getContext('2d');

        // Draw text with various styles
        ctx.textBaseline = 'top';
        ctx.font = '14px "Arial"';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);
        
        ctx.fillStyle = '#069';
        ctx.font = '11pt Arial';
        ctx.fillText('Chameleon 🦎', 2, 15);
        
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.font = 'bold 18pt Times';
        ctx.fillText('Fingerprint Test', 4, 45);

        // Get the canvas data as base64
        const canvasData = canvas.toDataURL();
        return canvasData;
    } catch (error) {
        console.error('Canvas error:', error);
        return 'canvas_error';
    }
}

// WebGL fingerprinting - GPU vendor and renderer information
function getWebGLFingerprint() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) return 'webgl_not_supported';

        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'unknown';
        const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown';

        return {
            vendor: vendor,
            renderer: renderer,
            version: gl.getParameter(gl.VERSION),
            shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION)
        };
    } catch (error) {
        console.error('WebGL error:', error);
        return 'webgl_error';
    }
}

// Audio fingerprinting - AudioContext processes signals with unique hardware variations
async function getAudioFingerprint() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return 'audio_not_supported';

        const context = new AudioContext();
        const oscillator = context.createOscillator();
        const analyser = context.createAnalyser();
        const gainNode = context.createGain();
        const scriptProcessor = context.createScriptProcessor(4096, 1, 1);

        gainNode.gain.value = 0; // Mute the sound
        oscillator.type = 'triangle';
        oscillator.frequency.value = 10000;

        oscillator.connect(analyser);
        analyser.connect(scriptProcessor);
        scriptProcessor.connect(gainNode);
        gainNode.connect(context.destination);

        oscillator.start(0);

        return new Promise((resolve) => {
            scriptProcessor.onaudioprocess = function(event) {
                const output = event.outputBuffer.getChannelData(0);
                const fingerprint = Array.from(output.slice(0, 30)).join(',');
                
                oscillator.stop();
                scriptProcessor.disconnect();
                context.close();
                
                resolve(fingerprint);
            };

            // Timeout after 1 second
            setTimeout(() => {
                try {
                    oscillator.stop();
                    scriptProcessor.disconnect();
                    context.close();
                } catch (e) {}
                resolve('audio_timeout');
            }, 1000);
        });
    } catch (error) {
        console.error('Audio error:', error);
        return 'audio_blocked';
    }
}

// Font detection - measures text rendering width to detect installed fonts
function getFontFingerprint() {
    const baseFonts = ['monospace', 'sans-serif', 'serif'];
    const testFonts = [
        'Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia',
        'Palatino', 'Garamond', 'Comic Sans MS', 'Trebuchet MS', 'Impact'
    ];

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const testString = 'mmmmmmmmmmlli';
    const fontSize = '72px';

    const baselines = {};
    baseFonts.forEach(baseFont => {
        ctx.font = `${fontSize} ${baseFont}`;
        baselines[baseFont] = ctx.measureText(testString).width;
    });

    const detectedFonts = [];
    testFonts.forEach(font => {
        baseFonts.forEach(baseFont => {
            ctx.font = `${fontSize} ${font}, ${baseFont}`;
            const width = ctx.measureText(testString).width;
            if (width !== baselines[baseFont]) {
                if (!detectedFonts.includes(font)) {
                    detectedFonts.push(font);
                }
            }
        });
    });

    return detectedFonts;
}

// Screen fingerprinting
function getScreenFingerprint() {
    return {
        width: screen.width,
        height: screen.height,
        availWidth: screen.availWidth,
        availHeight: screen.availHeight,
        colorDepth: screen.colorDepth,
        pixelDepth: screen.pixelDepth,
        pixelRatio: window.devicePixelRatio || 1
    };
}

// Navigator properties
function getNavigatorFingerprint() {
    return {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        languages: navigator.languages ? Array.from(navigator.languages) : [],
        hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
        deviceMemory: navigator.deviceMemory || 'unknown',
        maxTouchPoints: navigator.maxTouchPoints || 0
    };
}

// Timezone information
function getTimezoneFingerprint() {
    return {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: new Date().getTimezoneOffset()
    };
}

// Plugin detection
function getPluginsFingerprint() {
    const plugins = [];
    for (let i = 0; i < navigator.plugins.length; i++) {
        plugins.push({
            name: navigator.plugins[i].name,
            filename: navigator.plugins[i].filename
        });
    }
    return plugins;
}

// Touch support detection
function getTouchFingerprint() {
    return {
        maxTouchPoints: navigator.maxTouchPoints || 0,
        touchEvent: 'ontouchstart' in window,
        touchPoints: navigator.maxTouchPoints || 0
    };
}

// Do Not Track
function getDoNotTrack() {
    return navigator.doNotTrack || navigator.msDoNotTrack || window.doNotTrack || 'not_set';
}

// Cookies enabled
function getCookiesEnabled() {
    return navigator.cookieEnabled;
}

// Generate SHA-256 hash
async function generateHash(data) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// Display fingerprint in UI
function displayFingerprint() {
    document.getElementById('fingerprintId').textContent = fingerprintHash;
    document.getElementById('status').textContent = 'Fingerprint collected successfully';
    document.getElementById('status').className = 'status complete';

    const detailsContainer = document.getElementById('details');
    detailsContainer.innerHTML = `
        <div class="detail-item">
            <div class="detail-label">Canvas Hash</div>
            <div class="detail-value">${fingerprintData.canvas.substring(0, 40)}...</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">WebGL Vendor</div>
            <div class="detail-value">${typeof fingerprintData.webgl === 'object' ? fingerprintData.webgl.vendor : fingerprintData.webgl}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">WebGL Renderer</div>
            <div class="detail-value">${typeof fingerprintData.webgl === 'object' ? fingerprintData.webgl.renderer : 'N/A'}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">Audio Fingerprint</div>
            <div class="detail-value">${typeof fingerprintData.audio === 'string' ? fingerprintData.audio.substring(0, 30) + '...' : 'N/A'}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">Detected Fonts</div>
            <div class="detail-value">${fingerprintData.fonts.length} fonts detected</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">Screen Resolution</div>
            <div class="detail-value">${fingerprintData.screen.width}x${fingerprintData.screen.height}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">Platform</div>
            <div class="detail-value">${fingerprintData.navigator.platform}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">Language</div>
            <div class="detail-value">${fingerprintData.navigator.language}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">CPU Cores</div>
            <div class="detail-value">${fingerprintData.navigator.hardwareConcurrency}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">Timezone</div>
            <div class="detail-value">${fingerprintData.timezone.timezone}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">Touch Support</div>
            <div class="detail-value">${fingerprintData.touch.maxTouchPoints > 0 ? 'Yes' : 'No'}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">Cookies Enabled</div>
            <div class="detail-value">${fingerprintData.cookies ? 'Yes' : 'No'}</div>
        </div>
    `;
}

// Send fingerprint to server
document.getElementById('sendBtn').addEventListener('click', async () => {
    const btn = document.getElementById('sendBtn');
    const loader = document.getElementById('loader');
    const responseDiv = document.getElementById('serverResponse');

    btn.disabled = true;
    loader.style.display = 'block';
    responseDiv.style.display = 'none';

    try {
        const response = await fetch('http://localhost:3000/api/fingerprint', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: fingerprintHash,
                fingerprint: fingerprintData
            })
        });

        const data = await response.json();
        
        loader.style.display = 'none';
        responseDiv.className = 'server-response success';
        responseDiv.style.display = 'block';
        
        if (data.isNewVisitor) {
            responseDiv.innerHTML = `
                <strong>✅ New visitor recorded!</strong><br>
                First seen: ${new Date(data.firstSeen).toLocaleString()}<br>
                Visit count: ${data.visitCount}
            `;
        } else {
            responseDiv.innerHTML = `
                <strong>👋 Welcome back!</strong><br>
                First seen: ${new Date(data.firstSeen).toLocaleString()}<br>
                Last seen: ${new Date(data.lastSeen).toLocaleString()}<br>
                Visit count: ${data.visitCount}
            `;
        }
    } catch (error) {
        loader.style.display = 'none';
        responseDiv.className = 'server-response error';
        responseDiv.style.display = 'block';
        responseDiv.innerHTML = `
            <strong>❌ Error sending to server</strong><br>
            ${error.message}<br>
            Make sure the server is running at http://localhost:3000
        `;
        console.error('Server error:', error);
    } finally {
        btn.disabled = false;
    }
});