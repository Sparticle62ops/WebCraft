const STORAGE_KEYS = {
    PROFILE: 'webcraft_profile',
    SERVER: 'webcraft_server',
    USERNAME: 'webcraft_username',
};

const MOJANG_MANIFEST_URL = 'https://launchermeta.mojang.com/mc/game/version_manifest_v2.json';

/** Tries direct fetch, then CORS proxy so it works from file:// and strict networks. */
async function fetchWithCorsFallback(url) {
    try {
        const r = await fetch(url, { mode: 'cors' });
        if (r.ok) return r;
        throw new Error(r.statusText || 'Request failed');
    } catch (err) {
        const proxyUrl = 'https://corsproxy.io/?url=' + encodeURIComponent(url);
        const r = await fetch(proxyUrl);
        if (!r.ok) throw new Error('Connection failed. Run the app from a local server: npx serve . -l 3000');
        return r;
    }
}

export const VersionService = {
    async getVersions() {
        const response = await fetchWithCorsFallback(MOJANG_MANIFEST_URL);
        const data = await response.json();
        return data.versions || [];
    },
    async getVersionDetails(versionId) {
        const manifest = await this.getVersions();
        const version = manifest.find((v) => v.id === versionId);
        if (!version) throw new Error('Version not found');
        const response = await fetchWithCorsFallback(version.url);
        return await response.json();
    },
};

/** Modrinth loaders (categories). Used in search facets. */
export const MODRINTH_LOADERS = [
    { id: 'any', label: 'Any loader', category: null },
    { id: 'fabric', label: 'Fabric', category: 'fabric' },
    { id: 'forge', label: 'Forge', category: 'forge' },
    { id: 'quilt', label: 'Quilt', category: 'quilt' },
    { id: 'neoforge', label: 'NeoForge', category: 'neoforge' },
];

export const ModrinthService = {
    /**
     * @param {string} query - Search query
     * @param {string} projectType - mod | shader | resourcepack | world
     * @param {{ loader?: string, gameVersion?: string }} options - loader: fabric|forge|quilt|neoforge|any; gameVersion: e.g. 1.20.1
     */
    async search(query, projectType = 'mod', options = {}) {
        const parts = [];
        if (projectType === 'mod') {
            parts.push('["project_type:mod"]');
            const loader = (options.loader || 'fabric').toLowerCase();
            if (loader && loader !== 'any') parts.push(`["categories:${loader}"]`);
            if (options.gameVersion) parts.push(`["versions:${options.gameVersion}"]`);
        } else {
            parts.push(`["project_type:${projectType}"]`);
            if (options.gameVersion) parts.push(`["versions:${options.gameVersion}"]`);
        }
        const facetsParam = '[' + parts.join(',') + ']';
        const url = `https://api.modrinth.com/v2/search?query=${encodeURIComponent(query)}&facets=${encodeURIComponent(facetsParam)}`;
        const response = await fetchWithCorsFallback(url);
        const data = await response.json();
        return data.hits || [];
    },
};

/**
 * Normalizes a server address to a WebSocket URL for Eaglercraft-compatible servers.
 * Saves to sessionStorage for the game iframe.
 */
export const ProxyService = {
    async forwardServer(ip) {
        const trimmed = (ip || '').trim();
        if (!trimmed) throw new Error('Enter a server address');
        let wsUrl = trimmed;
        if (!/^wss?:\/\//i.test(wsUrl)) {
            wsUrl = (trimmed.startsWith('localhost') || /^\d+\.\d+\.\d+\.\d+$/.test(trimmed) ? 'ws://' : 'wss://') + trimmed;
        }
        try {
            new URL(wsUrl);
        } catch {
            throw new Error('Invalid server address');
        }
        sessionStorage.setItem(STORAGE_KEYS.SERVER, wsUrl);
        return wsUrl;
    },
    getStoredServer() {
        return sessionStorage.getItem(STORAGE_KEYS.SERVER) || '';
    },
};

export const AuthService = {
    getStoredProfile() {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    },
    setStoredProfile(profile) {
        try {
            if (profile) localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
            else localStorage.removeItem(STORAGE_KEYS.PROFILE);
        } catch (e) {
            console.warn('Could not save profile', e);
        }
    },
    getStoredUsername() {
        return localStorage.getItem(STORAGE_KEYS.USERNAME) || 'WebcraftPlayer';
    },
    setStoredUsername(name) {
        try {
            localStorage.setItem(STORAGE_KEYS.USERNAME, (name || 'WebcraftPlayer').trim() || 'WebcraftPlayer');
        } catch (e) {
            console.warn('Could not save username', e);
        }
    },
    /**
     * Microsoft OAuth: only works when server has MICROSOFT_CLIENT_ID etc. configured.
     * Otherwise returns { configured: false } so the UI can show "Use Offline mode" instead of opening a wrong page.
     */
    async login() {
        const apiBase = typeof window !== 'undefined' && window.location.origin;
        const loginUrl = `${apiBase}/api/auth/login`;
        try {
            const res = await fetch(loginUrl, { redirect: 'manual' });
            if (res.type === 'opaqueredirect' || res.status === 302) {
                const url = res.headers.get('Location');
                if (url && url.startsWith('https://login.microsoftonline.com')) {
                    window.location.href = url;
                    return null;
                }
            }
            const data = await res.json().catch(() => ({}));
            if (data.redirect && data.redirect.startsWith('https://login.microsoftonline.com')) {
                window.location.href = data.redirect;
                return null;
            }
            if (data.error) return { configured: false, error: data.error };
        } catch (e) {
            return { configured: false, error: 'Not configured' };
        }
        return { configured: false };
    },
};
