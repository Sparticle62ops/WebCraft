const STORAGE_KEYS = {
    PROFILE: 'webcraft_profile',
    SERVER: 'webcraft_server',
    USERNAME: 'webcraft_username',
};

export const VersionService = {
    async getVersions() {
        const response = await fetch('https://launchermeta.mojang.com/mc/game/version_manifest_v2.json');
        if (!response.ok) throw new Error('Failed to fetch version manifest');
        const data = await response.json();
        return data.versions || [];
    },
    async getVersionDetails(versionId) {
        const manifest = await this.getVersions();
        const version = manifest.find((v) => v.id === versionId);
        if (!version) throw new Error('Version not found');
        const response = await fetch(version.url);
        if (!response.ok) throw new Error('Failed to fetch version details');
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
        const response = await fetch(url);
        if (!response.ok) throw new Error('Modrinth search failed');
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
     * Microsoft OAuth: redirects to our API which then redirects to Microsoft.
     * Requires Vercel env: MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, NEXTAUTH_URL (or VERCEL_URL).
     */
    async login() {
        const apiBase = typeof window !== 'undefined' && window.location.origin;
        const loginUrl = `${apiBase}/api/auth/login`;
        try {
            const res = await fetch(loginUrl, { redirect: 'manual' });
            if (res.type === 'opaqueredirect' || res.status === 302) {
                const url = res.headers.get('Location');
                if (url) {
                    window.location.href = url;
                    return null;
                }
            }
            const data = await res.json().catch(() => ({}));
            if (data.redirect) {
                window.location.href = data.redirect;
                return null;
            }
            if (data.error) throw new Error(data.error);
        } catch (e) {
            if (e.message && e.message.includes('redirect')) return null;
            console.warn('Microsoft login not configured or failed:', e.message);
            window.open('https://login.live.com/', '_blank', 'noopener');
            return null;
        }
        return null;
    },
};
