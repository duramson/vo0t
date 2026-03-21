<div align="center">

# vo0t

### Web Bluetooth Controller for Storz & Bickel Vaporizers

[![Deploy](https://img.shields.io/github/actions/workflow/status/duramson/vo0t/deploy.yml?style=flat-square&label=deploy)](https://github.com/duramson/vo0t/actions)
[![License](https://img.shields.io/github/license/duramson/vo0t?style=flat-square)](LICENSE)
[![Built with Preact](https://img.shields.io/badge/built%20with-Preact-673ab8?style=flat-square)](https://preactjs.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=flat-square)](https://tailwindcss.com)

A fast, lightweight PWA that controls your vaporizer directly from the browser — no app store, no accounts, no cloud. Pure Web Bluetooth.

### [v.o0t.de](https://v.o0t.de)

</div>

---

## Supported Devices

| Device  | Status          |
| ------- | --------------- |
| Crafty+ | Fully supported |
| Crafty  | Supported       |

---

## Features

### Temperature Profiles

Create, edit, and instantly switch between custom temperature and boost presets. No more dialing in the same settings every session.

### Session Tracking & History

Automatic session recording with duration and temperature data. Review your usage over time directly in the app.

### Complete Device Control

- Target temperature, boost, and superboost
- Heater on/off toggle
- LED brightness and Auto-Off timer
- Vibration, charge LED, and permanent BT visibility
- Factory restart and diagnostic data readout

### Privacy First

Fully client-side. No accounts, no telemetry, no syncing. All data lives in your browser's local storage.

---

## Browser Requirements

Web Bluetooth is required. Not all browsers support it.

| Platform                | Supported Browsers                                                   |
| ----------------------- | -------------------------------------------------------------------- |
| Android                 | Chrome, Edge, any Chromium-based                                     |
| Windows / macOS / Linux | Chrome, Edge, any Chromium-based                                     |
| iOS / iPadOS            | WebBLE or Bluefy (App Store) — Safari does not support Web Bluetooth |

---

## Tech Stack

| Tool | |
|------|---|
| UI | [Preact](https://preactjs.com) + Hooks |
| Language | TypeScript (strict) |
| Bundler | Vite 8 |
| Styling | Tailwind CSS v4 |
| Protocol | Web Bluetooth API |

---

## Local Development

```sh
git clone https://github.com/duramson/vo0t.git
cd vo0t/app
npm install
npm run dev
```

Open the `localhost` URL in a Chromium-based browser. For a production build:

```sh
npm run build
# Output: app/dist/
```

---

## Acknowledgments

Protocol research and initial inspiration drawn from:

- [crafty-control](https://github.com/J-Cat/crafty-control) by J-Cat
- [reactive-volcano-app](https://github.com/firsttris/reactive-volcano-app) by firsttris

---

## Disclaimer

This project is independent and not affiliated with, endorsed by, or sponsored by Storz & Bickel GmbH & Co. KG. Use at your own risk.
