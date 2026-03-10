export const VersionService = {
    async getVersions() {
        const response = await fetch('https://launchermeta.mojang.com/mc/game/version_manifest_v2.json');
        const data = await response.json();
        return data.versions;
    },
    async getVersionDetails(versionId) {
        const manifest = await this.getVersions();
        const version = manifest.find(v => v.id === versionId);
        if (!version) throw new Error("Version not found");

        const response = await fetch(version.url);
        return await response.json();
    },
    async downloadToVFS(url, path) {
        console.log(`Downloading ${url} to ${path}...`);
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();

        // CheerpJ 3.0 uses a /str/ prefix for URL-based mounting or 
        // we can use the File API if integrated. 
        // For this launcher, we assume CheerpJ is initialized and we can write to /app/
        if (window.cheerpjAddStringFile) {
            // Mocking the write for now as real CheerpJ fs ops are specific
            // In CheerpJ 3.0, you often mount URLs directly.
        }
        return buffer;
    }
};

export const ModrinthService = {
    async search(query, projectType = 'mod') {
        const facets = projectType === 'mod' ? '[["categories:fabric"],["project_type:mod"]]' : `[["project_type:${projectType}"]]`;
        const url = `https://api.modrinth.com/v2/search?query=${encodeURIComponent(query)}&facets=${facets}`;
        const response = await fetch(url);
        const data = await response.json();
        return data.hits;
    }
};

export const ProxyService = {
    /**
     * Encapulates the logic for server forwarding.
     * In a Vercel environment, this would hit an API route that proxies TCP/UDP via WebSockets.
     */
    async forwardServer(ip) {
        console.log(`Forwarding connection to: ${ip} via Webcraft Proxy...`);
        // For demonstration, we simulate the proxy handshake
        return new Promise(resolve => setTimeout(() => resolve(`wss://webcraft-proxy.vercel.app/connect?target=${ip}`), 1500));
    }
};

export const AuthService = {
    async login() {
        // In a real implementation, this would trigger the Microsoft OAuth2 flow.
        // For this demo, we'll simulate a successful login after a short delay.
        return new Promise((resolve) => {
            console.log("Initiating Microsoft OAuth2 Flow...");
            setTimeout(() => {
                resolve({
                    name: "Steve",
                    avatar: "https://minotar.net/avatar/Steve/40.png",
                    token: "mock_msa_token_123"
                });
            }, 1000);
        });
    }
};
