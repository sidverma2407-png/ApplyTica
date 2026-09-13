# Applytica Chrome Extension

Applytica is an AI-powered job application assistant that helps users automatically fill job application forms using information extracted from their resume.

## Project Architecture

This extension is built using:
- **React 18** for UI components
- **TypeScript** for type safety
- **Vite** for fast bundling
- **Tailwind CSS v4** for styling
- **Chrome Extension Manifest V3**

### Entry Points
- `popup` (`index.html`): The extension popup interface.
- `options` (`options.html`): The full-page dashboard and settings UI.
- `background` (`src/background/index.ts`): The service worker for handling background events.
- `content` (`src/content/index.ts`): The script injected into webpages to interact with DOM elements (forms).

## Installation

1. Clone or download this repository.
2. Install dependencies:
   ```bash
   npm install
   ```

## Development

Run the Vite development server. While this starts a local server for the UI, true extension testing requires a build.

```bash
npm run dev
```

## Build

To build the extension for Chrome:

```bash
npm run build
```

This will create a `dist` folder containing the compiled extension, including `manifest.json`, `assets`, and entry HTML files.

## Loading the Extension in Chrome

1. Open Google Chrome.
2. Navigate to `chrome://extensions/`.
3. Enable **Developer mode** in the top right corner.
4. Click **Load unpacked** in the top left.
5. Select the `dist` folder that was generated after running the build command.
6. The Applytica extension should now appear in your extensions list.

## Current Features
- Modern UI for popup and dashboard.
- Chrome storage utility integration for profiles.
- Content script that can detect form fields on the active page.
