import { VersionService, ModrinthService, AuthService, ProxyService } from './services.js';
import { GameEngine } from './engine.js';

const STORAGE_MOD_LOADER = 'webcraft_mod_loader';

function escapeHtml(s) {
    if (s == null) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
}

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

    // Tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            tabs.forEach(t => t.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            tab.classList.add('active');
            const section = document.getElementById(`tab-${target}`);
            if (section) section.classList.add('active');
        });
    });

    const versionSelect = document.getElementById('version-select');
    const versionList = document.getElementById('version-list');
    const memRange = document.querySelector('input[type="range"]');
    const memLabel = document.getElementById('mem-label');
    const msBtn = document.getElementById('btn-ms-login');
    const offlineToggle = document.getElementById('offline-mode-toggle');
    const offlineUsernameWrap = document.getElementById('offline-username-wrap');
    const offlineUsernameInput = document.getElementById('offline-username-input');

    // Initialize Services
    window.selectVersion = (id) => {
        if (versionSelect) versionSelect.value = id;
        document.querySelector('[data-tab="home"]').click();
    };

    // Version list: loading then populate or error
    if (versionList) versionList.innerHTML = '<div class="news-card" style="grid-column:1/-1;color:var(--text-dim);">Loading versions…</div>';
    if (versionSelect) versionSelect.innerHTML = '<option value="">Loading…</option>';
    try {
        const versions = await VersionService.getVersions();
        const releases = (versions || []).filter(v => v.type === 'release');
        if (versionSelect && releases.length) {
            versionSelect.innerHTML = releases.slice(0, 20).map(v =>
                `<option value="${escapeHtml(v.id)}">${escapeHtml(v.id)}</option>`
            ).join('');
            if (!versionSelect.value) versionSelect.selectedIndex = 0;
        }
        if (versionList) {
            const list = (versions || []).slice(0, 40);
            versionList.innerHTML = list.length
                ? list.map(v => `
                    <div class="version-item news-card">
                        <h4>${escapeHtml(v.id)}</h4>
                        <small>${escapeHtml(v.type || 'release')}</small>
                        <button class="btn-primary" style="padding: 8px 16px; font-size: 0.8rem; margin-top: 10px;" type="button" data-select-version="${escapeHtml(v.id)}">SELECT</button>
                    </div>
                `).join('')
                : '<div class="news-card" style="grid-column:1/-1;color:var(--text-dim);">No versions found.</div>';
        }
        const modVersionSelect = document.getElementById('mod-version-select');
        if (modVersionSelect && releases.length) {
            const opts = releases.slice(0, 25).map(v => `<option value="${escapeHtml(v.id)}">${escapeHtml(v.id)}</option>`).join('');
            modVersionSelect.innerHTML = '<option value="">Any version</option>' + opts;
        }
    } catch (e) {
        console.error('Failed to load versions:', e);
        if (versionSelect) {
            versionSelect.innerHTML = '<option value="1.8.9">1.8.9</option><option value="1.20.1">1.20.1</option>';
            versionSelect.selectedIndex = 0;
        }
        if (versionList) versionList.innerHTML = '<div class="news-card" style="grid-column:1/-1;color:#ff5555;">Failed to load versions. Check connection and refresh.</div>';
        const modVerSelect = document.getElementById('mod-version-select');
        if (modVerSelect) modVerSelect.innerHTML = '<option value="">Any version</option><option value="1.20.1">1.20.1</option><option value="1.8.9">1.8.9</option>';
    }

    // Version list: delegate SELECT clicks and search
    if (versionList) {
        versionList.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-select-version]');
            if (btn) window.selectVersion(btn.dataset.selectVersion);
        });
    }
    const versionSearchInput = document.querySelector('#tab-versions .search-bar input');
    if (versionSearchInput && versionList) {
        versionSearchInput.addEventListener('input', () => {
            const q = (versionSearchInput.value || '').trim().toLowerCase();
            const cards = versionList.querySelectorAll('.version-item');
            cards.forEach(card => {
                const id = (card.querySelector('h4') || {}).textContent || '';
                card.style.display = !q || id.toLowerCase().includes(q) ? '' : 'none';
            });
        });
    }

    // Mod Search
    const modInput = document.getElementById('mod-search');
    const modList = document.getElementById('mod-list');
    const shaderList = document.getElementById('shader-list');
    const packList = document.getElementById('pack-list');
    const worldList = document.getElementById('world-list');

    const renderList = (data, container, type) => {
        if (!container) return;
        const list = Array.isArray(data) ? data : [];
        container.innerHTML = list.length
            ? list.map(m => {
                const desc = (m.description || '').slice(0, 80);
                const safeTitle = escapeHtml(m.title || '');
                const safeId = escapeHtml(m.project_id || '');
                return `
                    <div class="mod-card news-card" style="display: flex; flex-direction: column; justify-content: space-between;">
                        <div>
                            <div style="display:flex; align-items:center; gap:10px;">
                                <img src="${escapeHtml(m.icon_url || 'https://modrinth.com/favicon.ico')}" width="32" height="32" style="border-radius: 4px;" alt="">
                                <h4 style="margin: 0;">${safeTitle}</h4>
                            </div>
                            <p style="font-size: 0.7rem; color: var(--text-dim); margin-top:5px;">${escapeHtml(desc)}${desc.length >= 80 ? '…' : ''}</p>
                        </div>
                        <button class="btn-secondary" type="button" style="margin-top: 8px; width:100%;" data-add-id="${safeId}" data-add-title="${safeTitle}" data-add-type="${type}">
                            ${selectedMods.has(m.project_id) ? 'ADDED ✅' : 'ADD TO GAME'}
                        </button>
                    </div>
                `;
            }).join('')
            : '<div class="news-card" style="grid-column:1/-1;color:var(--text-dim);">No results. Try a different search.</div>';
    };

    const getSelectedModLoader = () => {
        const active = document.querySelector('.loader-pill.active');
        return (active && active.dataset.loader) || 'fabric';
    };

    const runModrinthSearch = async (query, container, type, options = {}) => {
        if (!container) return;
        const q = (query || '').trim();
        if (q.length < 2) {
            container.innerHTML = '<div class="news-card" style="grid-column:1/-1;color:var(--text-dim);">Type at least 2 characters to search.</div>';
            return;
        }
        container.innerHTML = '<div class="news-card" style="grid-column:1/-1;color:var(--text-dim);">Searching…</div>';
        try {
            const searchOptions = {};
            if (type === 'mod') {
                searchOptions.loader = options.loader ?? getSelectedModLoader();
                const modVerEl = document.getElementById('mod-version-select');
                if (modVerEl && modVerEl.value) searchOptions.gameVersion = modVerEl.value;
            }
            const data = await ModrinthService.search(q, type, searchOptions);
            renderList(data, container, type);
        } catch (err) {
            console.error('Modrinth search failed:', err);
            container.innerHTML = '<div class="news-card" style="grid-column:1/-1;color:#ff5555;">Search failed. Check connection and try again.</div>';
        }
    };

    const debounce = (fn, ms) => {
        let t;
        return (...args) => {
            clearTimeout(t);
            t = setTimeout(() => fn(...args), ms);
        };
    };

    const loaderPills = document.getElementById('loader-pills');
    if (loaderPills) {
        const savedLoader = localStorage.getItem(STORAGE_MOD_LOADER) || 'fabric';
        loaderPills.querySelectorAll('.loader-pill').forEach((pill) => {
            if (pill.dataset.loader === savedLoader) {
                pill.classList.add('active');
            } else {
                pill.classList.remove('active');
            }
            pill.addEventListener('click', () => {
                loaderPills.querySelectorAll('.loader-pill').forEach((p) => p.classList.remove('active'));
                pill.classList.add('active');
                localStorage.setItem(STORAGE_MOD_LOADER, pill.dataset.loader);
                if (modInput.value.trim().length >= 2) modInput.dispatchEvent(new Event('input'));
            });
        });
    }

    const modVersionSelect = document.getElementById('mod-version-select');
    if (modVersionSelect) {
        modVersionSelect.addEventListener('change', () => {
            if (modInput && modInput.value.trim().length >= 2) modInput.dispatchEvent(new Event('input'));
        });
    }

    const debounceMs = 320;
    const debouncedModSearch = (function () {
        let t;
        return (value, container, type) => {
            clearTimeout(t);
            t = setTimeout(() => runModrinthSearch(value, container, type), debounceMs);
        };
    })();

    if (modInput) modInput.addEventListener('input', (e) => debouncedModSearch(e.target.value, modList, 'mod'));
    const shaderSearch = document.getElementById('shader-search');
    if (shaderSearch) shaderSearch.addEventListener('input', (e) => debouncedModSearch(e.target.value, shaderList, 'shader'));
    const packSearch = document.getElementById('pack-search');
    if (packSearch) packSearch.addEventListener('input', (e) => debouncedModSearch(e.target.value, packList, 'resourcepack'));
    const worldSearch = document.getElementById('world-search');
    if (worldSearch) worldSearch.addEventListener('input', (e) => debouncedModSearch(e.target.value, worldList, 'world'));

    [modList, shaderList, packList, worldList].forEach(el => {
        if (el) el.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-add-id]');
            if (btn) window.addItem(btn.dataset.addId, btn.dataset.addTitle, btn.dataset.addType);
        });
    });

    window.addItem = (id, title, type) => {
        if (!id) return;
        selectedMods.add(id);
        console.log(`Added ${type}: ${title}`);
        const inputId = type === 'mod' ? 'mod-search' : (type === 'resourcepack' ? 'pack-search' : `${type}-search`);
        const inputEl = document.getElementById(inputId);
        if (inputEl && inputEl.value.trim().length >= 2) inputEl.dispatchEvent(new Event('input'));
    };

    // Multiplayer / Proxy Logic
    const proxyBtn = document.getElementById('btn-connect-proxy');
    const proxyStatus = document.getElementById('proxy-status');
    const serverInput = document.getElementById('server-ip');

    proxyBtn.addEventListener('click', async () => {
        const ip = serverInput.value;
        if (!ip) {
            proxyStatus.innerHTML = '<span style="color: #ff5555;">Enter a server address.</span>';
            return;
        }
        proxyBtn.disabled = true;
        proxyStatus.innerHTML = '<span style="color: var(--accent-glow);">Connecting…</span>';
        try {
            await ProxyService.forwardServer(ip);
            proxyStatus.innerHTML = '<span style="color: #4ade80;">Connected. Click PLAY NOW on Home to join.</span>';
            setTimeout(() => document.getElementById('btn-play').click(), 800);
        } catch (e) {
            proxyStatus.innerHTML = `<span style="color: #ff5555;">${escapeHtml(e.message)}</span>`;
        } finally {
            proxyBtn.disabled = false;
        }
    });

    window.connectServer = (ip) => {
        if (serverInput) serverInput.value = ip || '';
        document.querySelector('[data-tab="multiplayer"]')?.click();
        proxyBtn?.click();
    };

    document.getElementById('featured-servers')?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-connect]');
        if (btn) window.connectServer(btn.dataset.connect);
    });

    // Play Button Logic
    const btnPlay = document.getElementById('btn-play');
    if (btnPlay) {
        btnPlay.addEventListener('click', async () => {
            const version = (versionSelect && versionSelect.value) || (versionSelect && versionSelect.options?.[0]?.value) || '1.8.9';
            const isOffline = offlineToggle ? offlineToggle.checked : true;
            const displayName = document.getElementById('display-name');
            const username = displayName ? displayName.textContent : 'WebcraftPlayer';
            console.log(`Launching ${version} for ${username} (Offline: ${isOffline})`);
            await GameEngine.init({ version, offline: isOffline, username });
        });
    }

    // Auth: restore profile/username from storage
    const displayNameEl = document.getElementById('display-name');
    const statusEl = document.querySelector('.status');
    const avatarEl = document.getElementById('user-avatar');
    const profile = AuthService.getStoredProfile();
    if (profile && profile.name) {
        displayNameEl.textContent = profile.name;
        if (profile.avatar) avatarEl.innerHTML = `<img src="${escapeHtml(profile.avatar)}" width="40" height="40" style="border-radius: 10px;" alt="">`;
        if (statusEl) statusEl.textContent = 'Authenticated';
    } else {
        const storedUsername = AuthService.getStoredUsername();
        displayNameEl.textContent = storedUsername;
        if (offlineUsernameInput) offlineUsernameInput.value = storedUsername;
    }

    document.getElementById('btn-ms-login').addEventListener('click', async () => {
        const user = await AuthService.login();
        if (user) {
            displayNameEl.textContent = user.name;
            avatarEl.innerHTML = user.avatar ? `<img src="${escapeHtml(user.avatar)}" width="40" height="40" style="border-radius: 10px;" alt="">` : '';
            if (statusEl) statusEl.textContent = 'Authenticated';
            AuthService.setStoredProfile({ name: user.name, avatar: user.avatar });
        }
    });

    if (memRange) {
        memRange.addEventListener('input', (e) => {
            memLabel.textContent = e.target.value + 'GB';
        });
    }

    if (offlineToggle) {
        offlineToggle.addEventListener('change', (e) => {
            const isOffline = e.target.checked;
            if (offlineUsernameWrap) offlineUsernameWrap.style.display = isOffline ? 'block' : 'none';
            if (isOffline) {
                const name = (offlineUsernameInput && offlineUsernameInput.value.trim()) || AuthService.getStoredUsername();
                AuthService.setStoredUsername(name);
                displayNameEl.textContent = name || 'WebcraftPlayer';
                if (statusEl) statusEl.textContent = 'Offline';
                if (msBtn) { msBtn.disabled = true; msBtn.style.opacity = '0.5'; }
            } else {
                if (msBtn) { msBtn.disabled = false; msBtn.style.opacity = '1'; }
                const profile = AuthService.getStoredProfile();
                if (profile && profile.name) {
                    displayNameEl.textContent = profile.name;
                    if (statusEl) statusEl.textContent = 'Authenticated';
                } else {
                    displayNameEl.textContent = AuthService.getStoredUsername();
                    if (statusEl) statusEl.textContent = 'Guest';
                }
            }
        });
        const isOffline = offlineToggle.checked;
        if (offlineUsernameWrap) offlineUsernameWrap.style.display = isOffline ? 'block' : 'none';
        if (isOffline && msBtn) { msBtn.disabled = true; msBtn.style.opacity = '0.5'; }
    }

    if (offlineUsernameInput) {
        offlineUsernameInput.addEventListener('change', () => AuthService.setStoredUsername(offlineUsernameInput.value));
        offlineUsernameInput.addEventListener('blur', () => AuthService.setStoredUsername(offlineUsernameInput.value));
        if (offlineToggle && offlineToggle.checked) {
            displayNameEl.textContent = offlineUsernameInput.value.trim() || AuthService.getStoredUsername();
        }
    }

    // Copy Logs
    const btnCopyLogs = document.getElementById('btn-copy-logs');
    if (btnCopyLogs && consoleEl) {
        btnCopyLogs.addEventListener('click', () => {
            const text = consoleEl.innerText || '';
            navigator.clipboard.writeText(text).then(() => {
                btnCopyLogs.textContent = 'COPIED!';
                setTimeout(() => { btnCopyLogs.textContent = 'COPY LOGS'; }, 2000);
            }).catch(() => {});
        });
    }
});
