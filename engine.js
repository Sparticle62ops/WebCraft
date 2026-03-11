import { ProxyService } from './services.js';

// Relative path works for both file:// and deployed (Vercel)
const EAGLERCRAFT_PLAY_PATH = 'play.html';

/**
 * Launches the game by embedding the Eaglercraft client (play.html iframe).
 * Appends overlay so Home tab content stays in DOM and is visible again on exit.
 */
export const GameEngine = {
    async init({ version, offline, username }) {
        const display = document.getElementById('tab-home');
        if (!display) return;

        // Remove any existing game overlay (e.g. from a previous play)
        const existing = document.getElementById('game-wrapper');
        if (existing) existing.remove();

        const server = ProxyService.getStoredServer();
        const query = server ? `?server=${encodeURIComponent(server)}` : '';
        const iframeUrl = EAGLERCRAFT_PLAY_PATH + query;

        const wrapper = document.createElement('div');
        wrapper.id = 'game-wrapper';
        wrapper.style.cssText = 'position:fixed;inset:0;z-index:100;background:#0a0a0a;display:flex;flex-direction:column;';
        wrapper.innerHTML = `
            <div style="flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:#111;border-bottom:1px solid rgba(255,255,255,0.08);">
                <span style="color:#9ca3af;font-size:0.9rem;">Webcraft — Minecraft 1.8 (Eaglercraft)</span>
                <button id="game-close-btn" type="button" style="background:#1e1e1e;color:#e5e7eb;border:1px solid rgba(255,255,255,0.15);padding:8px 16px;border-radius:8px;cursor:pointer;font-weight:600;">Exit game</button>
            </div>
            <iframe id="game-container" src="${iframeUrl}" title="Minecraft" allow="fullscreen; gamepad" allowfullscreen style="flex:1;width:100%;border:none;display:block;"></iframe>
        `;

        const iframe = wrapper.querySelector('#game-container');
        if (iframe) iframe.src = iframeUrl;

        const closeBtn = wrapper.querySelector('#game-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                wrapper.remove();
                window.dispatchEvent(new CustomEvent('webcraft-game-closed'));
            });
        }

        display.appendChild(wrapper);
    },
};
