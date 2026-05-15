/**
 * Parse QR payload: prescripto://profile-link?token=... or raw JWT.
 */
export function extractProfileLinkToken(raw: string): string | null {
    const s = raw.trim();
    if (!s) return null;
    try {
        if (s.includes('token=')) {
            let normalized = s;
            if (s.startsWith('prescripto://')) {
                normalized = s.replace(/^prescripto:\/\//, 'https://');
            } else if (s.startsWith('dawini://')) {
                normalized = s.replace(/^dawini:\/\//, 'https://');
            }
            const u = new URL(normalized);
            const t = u.searchParams.get('token');
            if (t) return decodeURIComponent(t);
        }
    } catch {
        /* ignore */
    }
    const parts = s.split('.');
    if (parts.length === 3 && parts[0].length > 0 && parts[1].length > 0) {
        return s;
    }
    return null;
}
