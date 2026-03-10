import { VersionService } from './services.js';
import { ModrinthService } from './services.js';
import { AuthService } from './services.js';
import { GameEngine } from './engine.js';

document.addEventListener('DOMContentLoaded', async () => {
    const tabs = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.tab-content');
    const consoleEl = document.getElementById('game-console');
    const selectedMods = new Set();

    // Hook console
    const oldLog = console.log;
    console.log = function (...args) {
        oldLog.apply(console, args);
        if (consoleEl) {
            const line = document.createElement('div');
            line.innerHTML = `<span style="color: var(--text-dim); opacity: 0.5;">[${new Date().toLocaleTimeString()}]</span> ${args.join(' ')}`;
            consoleEl.appendChild(line);
            consoleEl.scrollTop = consoleEl.scrollHeight;
        }
    };

    // Tab Switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            tabs.forEach(t => t.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`tab-${target}`).classList.add('active');
        });
    });

    // Initialize Services
    // Expose selectVersion to global scope
    window.selectVersion = (id) => {
        versionSelect.value = id;
        document.querySelector('[data-tab="home"]').click();
    };

    try {
        const versions = await VersionService.getVersions();
        // Show only releases by default to keep it clean
        const releases = versions.filter(v => v.type === 'release');
        versionSelect.innerHTML = releases.slice(0, 15).map(v =>
            `<option value="${v.id}">${v.id}</option>`
        ).join('');

        versionList.innerHTML = versions.slice(0, 30).map(v => `
            <div class="version-item news-card">
                <h4>${v.id}</h4>
                <small>${v.type}</small>
                <button class="btn-primary" style="padding: 8px 16px; font-size: 0.8rem; margin-top: 10px;" onclick="window.selectVersion('${v.id}')">SELECT</button>
            </div>
        `).join('');
    } catch (e) {
        console.error("Failed to load versions:", e);
    }

    // Mod Search
    const modInput = document.getElementById('mod-search');
    const modList = document.getElementById('mod-list');

    // Universal Search Function
    const renderList = (data, container, type) => {
        container.innerHTML = data.map(m => `
            <div class="mod-card news-card">
                <div style="display:flex; align-items:center; gap:10px;">
                    <img src="${m.icon_url || 'https://modrinth.com/favicon.ico'}" width="32" height="32" style="border-radius: 4px;">
                    <h4>${m.title}</h4>
                </div>
                <p style="font-size: 0.7rem; color: var(--text-dim); margin-top:5px;">${m.description.slice(0, 60)}...</p>
                <button class="btn-secondary" style="margin-top: 8px; width:100%;" onclick="window.addItem('${m.project_id}', '${m.title}', '${type}')">
                    ${selectedMods.has(m.project_id) ? 'ADDED ✅' : 'ADD TO GAME'}
                </button>
            </div>
        `).join('');
    };

    modInput.addEventListener('input', async (e) => {
        if (e.target.value.length < 3) return;
        const data = await ModrinthService.search(e.target.value, 'mod');
        renderList(data, modList, 'mod');
    });

    document.getElementById('shader-search').addEventListener('input', async (e) => {
        if (e.target.value.length < 3) return;
        const data = await ModrinthService.search(e.target.value, 'shader');
        renderList(data, document.getElementById('shader-list'), 'shader');
    });

    document.getElementById('pack-search').addEventListener('input', async (e) => {
        if (e.target.value.length < 3) return;
        const data = await ModrinthService.search(e.target.value, 'resourcepack');
        renderList(data, document.getElementById('pack-list'), 'resourcepack');
    });

    document.getElementById('world-search').addEventListener('input', async (e) => {
        if (e.target.value.length < 3) return;
        const data = await ModrinthService.search(e.target.value, 'world');
        renderList(data, document.getElementById('world-list'), 'world');
    });

    window.addItem = (id, title, type) => {
        selectedMods.add(id);
        console.log(`Added ${type}: ${title}`);
        // Dispatch input to refresh UI
        const tabMap = { 'mod': 'mods', 'shader': 'shaders', 'resourcepack': 'resourcepacks', 'world': 'worlds' };
        const inputId = type === 'mod' ? 'mod-search' : `${type === 'resourcepack' ? 'pack' : type}-search`;
        document.getElementById(inputId).dispatchEvent(new Event('input'));
    };

    // Multiplayer / Proxy Logic
    const proxyBtn = document.getElementById('btn-connect-proxy');
    const proxyStatus = document.getElementById('proxy-status');
    const serverInput = document.getElementById('server-ip');

    proxyBtn.addEventListener('click', async () => {
        const ip = serverInput.value;
        if (!ip) return;

        proxyBtn.disabled = true;
        proxyStatus.innerHTML = `<span style="color: var(--accent-glow);">Handshaking with Vercel Edge Proxy...</span>`;

        try {
            const proxyUrl = await ProxyService.forwardServer(ip);
            proxyStatus.innerHTML = `<span style="color: #4ade80;">Proxy Established: ${proxyUrl}</span>`;
            console.log(`Tunneling established to ${ip}`);

            setTimeout(() => {
                document.getElementById('btn-play').click();
            }, 1000);
        } catch (e) {
            proxyStatus.innerHTML = `<span style="color: #ff5555;">Proxy Failed: ${e.message}</span>`;
        } finally {
            proxyBtn.disabled = false;
        }
    });

    window.connectServer = (ip) => {
        serverInput.value = ip;
        document.querySelector('[data-tab="multiplayer"]').click();
        proxyBtn.click();
    };

    // Play Button Logic
    document.getElementById('btn-play').addEventListener('click', async () => {
        const version = versionSelect.value;
        const isOffline = document.getElementById('offline-mode-toggle').checked;

        console.log(`Launching ${version} (Offline: ${isOffline})`);

        // Initialize CheerpJ Engine
        await GameEngine.init({
            version,
            offline: isOffline,
            username: document.getElementById('display-name').textContent
        });
    });

    // Auth Logic
    document.getElementById('btn-ms-login').addEventListener('click', async () => {
        const user = await AuthService.login();
        if (user) {
            document.getElementById('display-name').textContent = user.name;
            document.getElementById('user-avatar').innerHTML = `<img src="${user.avatar}" width="40" height="40" style="border-radius: 10px;">`;
            document.querySelector('.status').textContent = 'Authenticated';
        }
    });

    // Settings listeners
    const memRange = document.querySelector('input[type="range"]');
    const memLabel = document.getElementById('mem-label');
    // Copy Logs
    document.getElementById('btn-copy-logs').addEventListener('click', () => {
        const text = consoleEl.innerText;
        navigator.clipboard.writeText(text);
        const btn = document.getElementById('btn-copy-logs');
        btn.textContent = 'COPIED!';
        setTimeout(() => btn.textContent = 'COPY LOGS', 2000);
    });

    // Offline Toggle logic
    const msBtn = document.getElementById('btn-ms-login');
    const offlineToggle = document.getElementById('offline-mode-toggle');

    offlineToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
            document.getElementById('display-name').textContent = 'Player';
            document.querySelector('.status').textContent = 'Offline Mode';
            msBtn.disabled = true;
            msBtn.style.opacity = '0.5';
        } else {
            msBtn.disabled = false;
            msBtn.style.opacity = '1';
        }
    });
});
