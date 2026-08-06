# 🦎 Chameleon - Browser Fingerprint Auditor & Tracker

Chameleon is a comprehensive project designed to demonstrate both the mechanics of browser fingerprinting and the techniques used to defend against it. It consists of two main components:
1. **Chameleon Tracker**: A Node.js/Express and MongoDB backend web application that acts as a tracking server, gathering device attributes to create a unique browser fingerprint.
2. **Chameleon Extension**: A Chrome extension that intercepts and spoofs fingerprinting APIs in real-time, protecting the user by injecting noise into the fingerprint.

## 🚀 Features

* **Fingerprint Collection**: Collects data from Canvas, WebGL, AudioContext, Fonts, Screen specs, Navigator, and more.
* **API Spoofing**: Intercepts fingerprinting attempts by adding noise to Canvas/Audio data and returning fake WebGL/Navigator details.
* **Admin Dashboard**: A tracker interface to visualize collected fingerprints, showing how Chameleon protects privacy.
* **Manifest V3**: The Chrome extension is built using the latest Manifest V3 architecture.

## 📁 Project Structure

* `chameleon/`: The Chrome Extension source code.
  * `content.js`: Runs in isolated world, injects `inject.js`.
  * `inject.js`: Runs in page world, monkey-patches fingerprinting APIs.
  * `popup/`: The extension popup dashboard.
* `chameleon-tracker/`: The backend tracking server.
  * `backend/`: Node.js, Express, and MongoDB REST API routes.
  * `frontend/`: The tracking demo page and admin dashboard.

## 🛠️ Installation & Setup

### 1. Setting up the Tracker Server
You will need [Node.js](https://nodejs.org/) and [MongoDB](https://www.mongodb.com/) installed on your machine.

```bash
cd chameleon-tracker
npm install
npm start
```
Make sure MongoDB is running locally at `mongodb://localhost:27017`. Once started, the tracker will be available at `http://localhost:3000`.

### 2. Loading the Chrome Extension
1. Open Google Chrome and go to `chrome://extensions/`.
2. Enable **Developer mode** (toggle in the top right).
3. Click **Load unpacked** and select the `chameleon` folder from this repository.
4. Pin the extension to your toolbar to see the blocked attempts in real-time.

## 🧠 How it Works

* **Tracker**: When you visit the tracker page, it executes a series of tests to query your hardware capabilities (like drawing a hidden canvas and measuring the exact pixels). It then hashes these results into a unique SHA-256 identifier and saves it to MongoDB.
* **Extension**: The extension injects a script before the page loads. When the page tries to query your canvas or audio hardware, the extension intercepts the call and adds a tiny, randomized mathematical noise to the output. This causes the generated hash to change on every page load, making tracking impossible.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!

## 📜 License
This project is licensed under the MIT License.
