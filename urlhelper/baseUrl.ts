// Single source of truth for the backend's base URL. Point NEXT_PUBLIC_API_BASE_URL
// at the real backend once it exists; everything under urlhelper/endpoints builds on this.
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081/api';

// Server origin without the /api suffix — uploaded files (e.g. avatarUrl: "/uploads/...")
// are served from WebConfig's resource handler at the servlet root, not under /api.
export const FILE_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

// Resolves a relative file URL (e.g. "/uploads/avatars/x.jpg") returned by the backend
// into an absolute URL the browser can load directly in an <img src>.
export const resolveFileUrl = (url?: string | null): string | undefined => {
    if (!url) return undefined;
    if (/^https?:\/\//i.test(url)) return url;
    return `${FILE_BASE_URL}${url}`;
};
