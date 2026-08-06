# Chameleon

A Chrome extension that intercepts browser fingerprinting techniques and feeds trackers fake, human-plausible data — making your browser un-trackable across sessions without breaking how sites actually function.

Paired with `chameleon-tracker`, a companion tracking web app built to demonstrate the exact fingerprinting techniques Chameleon defends against — showing both sides of the web tracking problem.

## The Problem

Cookie-based tracking is easy to defeat: clear your cookies or use private browsing mode, and the tracker loses your identity. **Browser fingerprinting** solves that problem for advertisers by collecting device-level attributes — canvas rendering output, GPU specifications, audio processing quirks, installed fonts, CPU core count — that remain stable across sessions and cannot be cleared like a cookie. It is passive, silent, and nearly impossible to opt out of through standard privacy settings.

Chameleon intercepts these fingerprinting calls before they reach the page and returns spoofed values instead. The visual behavior remains identical, but the underlying fingerprint changes on every load.

## How It Works

Chrome extensions run in an **isolated JavaScript world** — they can read the page's DOM but cannot overwrite native functions the page's own scripts use. Chameleon circumvents this with a two-script injection pattern:

- **`content.js`** (isolated world) — executes on page load and injects `inject.js` into the page via a `<script>` tag so it executes in the page's real JavaScript context.
- **`inject.js`** (page world) — monkey-patches the native browser APIs trackers rely on:

| Vector | Technique |
|---|---|
| **Canvas fingerprinting** | Overrides `HTMLCanvasElement.prototype.toDataURL` — pulls pixel data via `getImageData`, adds ±1 random noise to RGB channels, and writes it back. Visually identical, hash completely different. |
| **WebGL fingerprinting** | Overrides `WebGLRenderingContext.prototype.getParameter` — returns a randomized fake GPU vendor/renderer (e.g. reports NVIDIA instead of your actual hardware) instead of `UNMASKED_VENDOR_WEBGL`/`UNMASKED_RENDERER_WEBGL`. |
| **Audio fingerprinting** | Patches `createScriptProcessor` on the Web Audio API — injects microscopic random offsets into output buffer samples, disrupting the DSP-based signature. |
| **Navigator spoofing** | Uses `Object.defineProperty` to override read-only getters like `navigator.hardwareConcurrency`, `navigator.deviceMemory`, and `navigator.platform` (these cannot be reassigned directly since they are native getters). |

Because `inject.js` runs in the page world, it cannot communicate with the extension directly. It dispatches a `CustomEvent` (`chameleon_detection`), which `content.js` listens for and forwards to the popup via `chrome.runtime.sendMessage`.

The companion tracker (`chameleon-tracker/`) hashes 11 collected attributes (canvas, WebGL, audio, fonts, screen, navigator, timezone, plugins, etc.) with SHA-256 to generate a visitor ID, and stores visits in MongoDB. With Chameleon active, that hash changes every page load, ensuring the tracker records a "new visitor" every time instead of recognizing a returning user.

## Demo

![Chameleon Demo](demo.gif)

*Fingerprint hash changing on every reload with Chameleon enabled, versus remaining identical with it disabled.*

## Tech Stack

* **Extension:** JavaScript, Chrome Extension Manifest V3, Chrome Extension APIs (content scripts, page-world injection)
* **Tracker application:** Node.js, Express, MongoDB, Mongoose, Web Crypto API (SHA-256)

## Installation

1. Clone this repository.
2. Follow the specific setup instructions in the tracker and extension directories.

## Technical Challenges

- **Isolated world limitations** — Chrome extensions cannot directly overwrite page-context prototypes, which required the two-script injection pattern (`content.js` → `inject.js`) using `CustomEvent` messaging to bridge the two contexts.
- **Spoofing without breaking sites** — The injected noise had to be small enough (±1 pixel RGB, ~0.00005 audio offset) to remain visually and functionally invisible while successfully altering the underlying hash.
- **Detectability of the spoofing itself** — Sophisticated trackers can invoke `.toString()` on a patched function to determine if it is native code or a JavaScript wrapper, or cross-check spoofed values for consistency (e.g., an NVIDIA GPU string paired with an iPhone user agent is an obvious anomaly).

## Future Improvements

- Proxy `Function.prototype.toString` so patched methods still report as native code under inspection.
- Implement consistent device profiles (e.g., "spoof as Windows Desktop") so all spoofed attributes match each other rather than being randomized independently.
- Introduce per-site toggle controls and a canvas-inspection dashboard displaying what a site attempted to capture.
- Add a local in-memory fallback for the tracker application when MongoDB is unavailable.
