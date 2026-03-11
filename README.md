# Webcraft Launcher

A **deployment-ready**, web-based Minecraft launcher that runs [Eaglercraft](https://dev.eaglercraft.com) 1.8 in the browser — singleplayer, multiplayer, and shared worlds. Built for [Vercel](https://vercel.com).

## Features

- **Play in browser**: Full Eaglercraft 1.8 client (singleplayer, multiplayer, shared worlds).
- **Mojang versions**: Browse and select game versions from the official manifest.
- **Modrinth**: Search and add Fabric mods, shaders, resource packs, and worlds.
- **Multiplayer**: Connect to Eaglercraft-compatible servers; address is passed into the game when you hit PLAY.
- **Offline mode**: Custom username stored in `localStorage`; no account required.
- **Microsoft login**: Optional; configure OAuth in Vercel for full account support.

## Deploy to Vercel

1. **Fork or clone** this repo and push to GitHub.
2. In [Vercel](https://vercel.com), **Import** the repository.
3. **Deploy** — no build step; it’s static files + optional API routes.
4. Optional: add **Environment variables** for Microsoft auth:
   - `MICROSOFT_CLIENT_ID`
   - `MICROSOFT_CLIENT_SECRET`
   - (Redirect URI will be `https://<your-domain>/api/auth/callback`.)

## Local development

```bash
npm install
npm run dev
```

Then open **http://localhost:3000**.  
Without npm you can use any static server, e.g. `npx serve . -l 3000` or `python -m http.server 8000`.

## How to use

1. **Launch**: Open the deployed or local URL.
2. **Auth**: In **Settings**, turn on **Offline mode** and set a username (saved in browser), or use **Sign in with Microsoft** if configured.
3. **Versions**: Use the **Versions** tab to pick a version (used for launcher metadata; the game runs Eaglercraft 1.8).
4. **Mods / Shaders / Packs / Worlds**: Search in the respective tabs; results come from Modrinth.
5. **Multiplayer**: In **Servers**, enter an Eaglercraft server address (e.g. `eagler.aarchon.net` or `wss://...`), click **PROXY & PLAY**, then **PLAY NOW** on Home. The game loads with that server.
6. **Play**: Click **PLAY NOW** on Home. The game runs in-page; use **Exit game** to return to the launcher.

## Tech stack

- **Frontend**: Vanilla HTML/CSS/JS (ES modules), no framework.
- **APIs**: Mojang version manifest, Modrinth search.
- **Game**: Eaglercraft 1.8 via iframe to official client; `play.html` forwards optional `?server=` to it.
- **Hosting**: Vercel (static + optional `/api/auth/login` for Microsoft OAuth).

## Project structure

```
├── index.html      # Launcher UI
├── main.js         # Tabs, versions, Modrinth, auth, play
├── style.css       # Layout and theme
├── services.js     # Version, Modrinth, Proxy, Auth
├── engine.js       # Game launch (iframe to play.html)
├── play.html       # Wrapper that loads Eaglercraft with optional server param
├── vercel.json     # Clean URLs, COOP header
├── api/auth/       # Optional Microsoft OAuth (login.js)
└── README.md
```

## License

Use and modify as you like. Eaglercraft is a separate project; see [dev.eaglercraft.com](https://dev.eaglercraft.com) for its terms and credits.
