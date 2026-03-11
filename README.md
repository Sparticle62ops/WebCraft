# Eagler-Next: Modern Web Minecraft Launcher

A premium, web-based Minecraft launcher targeting 1.20+ with support for loading Fabric mods via CheerpJ 3.0.

## Features
- **Modern UI**: Glassmorphism design with smooth animations.
- **Universal Versions**: Play any version from 1.7.2 to 1.21+.
- **Modrinth Integration**: Browse and add Fabric mods directly.
- **Official Auth**: Secure Microsoft Account login.
- **Offline Mode**: Optional "Cracked" mode (hidden in settings).

## How to Host (Vercel)
1. Fork or download this directory.
2. Push to GitHub.
3. Import to [Vercel](https://vercel.com).
4. Done! It works as a static site.

## Quick Test (Local)
To test the launcher immediately on your machine:
1.  Open a terminal in this directory.
2.  Run `npm install && npm start`.
3.  Open `http://localhost:3000` (or whichever port is shown).

Alternatively, if you have **Python** installed:
`python -m http.server 8000`

## How to Use
1. **Launch**: Open the hosted URL.
2. **Auth**: Go to **Settings** and toggle **Offline Mode** (fastest for testing) or click "Sign in with Microsoft".
3. **Select Version**: Go to the **Versions** tab and hit **SELECT** on a version.
4. **Mods**: Search and add mods in the **Mods** tab.
5. **Play**: Hit **PLAY NOW** on the Home screen and watch the **Console** tab for logs.

> [!NOTE]
> The launcher initializes the **CheerpJ 3.0** engine. To run the game, the launcher dynamically mounts the selected official Minecraft JARs into the browser's virtual memory.

## Development
This project uses:
- **HTML5/CSS3** (Vanilla)
- **Javascript** (ES6 Modules)
- **CheerpJ 3.0** (Wasm-based JVM)
- **Modrinth API** & **Mojang API**
