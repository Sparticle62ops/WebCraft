/**
 * Microsoft OAuth entry point for Webcraft launcher.
 * Set VERCEL_URL (or NEXTAUTH_URL), MICROSOFT_CLIENT_ID, and MICROSOFT_CLIENT_SECRET in Vercel to enable.
 * Redirects to Microsoft login; callback should be at /api/auth/callback.
 */
export const config = { runtime: 'nodejs' };

export default function handler(req, res) {
    const base = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const redirectUri = `${base}/api/auth/callback`;
    const scope = 'XboxLive.signin offline_access';

    if (!clientId) {
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json({
            error: 'Microsoft login not configured',
            hint: 'Set MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET in Vercel environment variables.',
        });
        return;
    }

    const url =
        'https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize?' +
        new URLSearchParams({
            client_id: clientId,
            response_type: 'code',
            redirect_uri: redirectUri,
            scope,
            response_mode: 'query',
        }).toString();

    res.redirect(302, url);
}
