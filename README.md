# vo0t - Web Controller

**Live App:** [v.o0t.de](https://v.o0t.de)

A fast, lightweight, and modern web application to control your vaporizers directly from your browser. Bypassing the need for native app store installations, this Progressive Web App (PWA) relies on the Web Bluetooth API to communicate securely and locally with your device.

## Supported Devices

- **Crafty**
- **Crafty+**

## Features

While covering the standard device settings, this web controller introduces several advanced features to enhance the daily usage of your vaporizer:

- **Temperature Profiles:** Create, edit, and quickly toggle between custom temperature and boost presets. No need to dial in the exact temperature every time.
- **Session Tracking & History:** Automatically track your usage sessions. Monitor your session lengths and temperature curves over time.
- **Complete Device Control:**
  - Set target temperature, boost, and superboost.
  - Toggle heater state.
  - Adjust LED brightness and Auto-Off timer.
  - Toggle vibration, charge LED, and permanent Bluetooth visibility.
  - Trigger factory restarts and read diagnostic data.
- **Modern UI:** Built with a clean, dark-themed interface, fluid animations, and highly responsive controls.
- **Privacy First:** Fully client-side. No accounts, no data logging, no cloud syncing. All profiles and session history are stored locally on your device.

## Requirements

Since this application relies on the Web Bluetooth API, you need a compatible browser:

- **Android / Desktop (Windows, macOS, Linux):** Google Chrome, Microsoft Edge, or other Chromium-based browsers.
- **iOS / iPadOS:** Apple restricts Web Bluetooth in Safari. You must use a specialized browser like WebBLE or Bluefy from the App Store.

## Technology Stack

This project is built with a strong focus on performance and minimal bundle size:

- Preact (with Hooks)
- TypeScript
- Vite
- Tailwind CSS v4
- Web Bluetooth API

## Local Development

If you want to run this application locally or contribute:

1. Clone the repository
2. Navigate into the `app` directory: `cd app`
3. Install dependencies: `npm install`
4. Start the development server: `npm run dev`
5. Open the provided `localhost` URL in a supported browser.

To create a production build, run `npm run build`. The output will be placed in the `app/dist` directory.

## Acknowledgments

A special thanks to the open-source community for paving the way. Parts of the initial Bluetooth protocol understanding and project inspiration were drawn from:

- [crafty-control by J-Cat](https://github.com/J-Cat/crafty-control)
- [reactive-volcano-app by firsttris](https://github.com/firsttris/reactive-volcano-app)

## Disclaimer

This project is an independent open-source venture and is not affiliated with, endorsed by, or sponsored by Storz & Bickel GmbH & Co. KG. Use this software at your own risk. The authors are not responsible for any damage caused to your device.
