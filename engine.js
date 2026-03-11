import { ProxyService } from './services.js';

const EAGLERCRAFT_PLAY_PATH = '/play.html';

/**
 * Launches the game by embedding the Eaglercraft client (play.html iframe).
 * Uses stored server from ProxyService if user connected via Servers tab.
 */
export const GameEngine = {
    async init({ version, offline, username }) {
        const display = document.getElementById('tab-home');
        if (!display) return;

        const server = ProxyService.getStoredServer();
        const query = server ? `?server=${encodeURIComponent(server)}` : '';
        const iframeUrl = EAGLERCRAFT_PLAY_PATH + query;

        display.innerHTML = `
            <div id="game-wrapper" style="position:fixed;inset:0;z-index:100;background:#0a0a0a;display:flex;flex-direction:column;">
                <div style="flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:#111;border-bottom:1px solid rgba(255,255,255,0.08);">
                    <span style="color:#9ca3af;font-size:0.9rem;">Webcraft — Minecraft 1.8 (Eaglercraft)</span>
                    <button id="game-close-btn" type="button" style="background:#1e1e1e;color:#e5e7eb;border:1px solid rgba(255,255,255,0.15);padding:8px 16px;border-radius:8px;cursor:pointer;font-weight:600;">Exit game</button>
                </div>
                <iframe id="game-container" src="${iframeUrl}" title="Minecraft" allow="fullscreen; gamepad" allowfullscreen style="flex:1;width:100%;border:none;display:block;"></iframe>
            </div>
        `;

        const closeBtn = document.getElementById('game-close-btn');
        const wrapper = document.getElementById('game-wrapper');
        if (closeBtn && wrapper) {
            closeBtn.addEventListener('click', () => {
                wrapper.remove();
                window.dispatchEvent(new CustomEvent('webcraft-game-closed'));
            });
        }
    },
};
