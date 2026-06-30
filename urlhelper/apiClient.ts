import { API_BASE_URL } from './baseUrl';
import { AUTH_ENDPOINTS } from './endpoints/auth';

export class ApiError extends Error {
    status: number;
    payload: unknown;

    constructor(message: string, status: number, payload?: unknown) {
        super(message);
        this.status = status;
        this.payload = payload;
    }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
    body?: unknown;
}

const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
const getRefreshToken = () => (typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null);

// Fired whenever the session is invalidated because a refresh attempt failed —
// App.tsx listens for this to clear Redux auth state and bounce to /auth/login instead
// of leaving the dashboard rendered with every request silently failing.
export const SESSION_EXPIRED_EVENT = 'auth:session-expired';

const clearStoredSession = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('authUser');
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
};

// Coalesces concurrent 401/403s into a single /auth/refresh call rather than firing one per
// failed request.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    if (!refreshPromise) {
        refreshPromise = fetch(`${API_BASE_URL}${AUTH_ENDPOINTS.REFRESH}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        })
            .then(async (response) => {
                if (!response.ok) return null;
                const body = await response.json().catch(() => null);
                const data = body?.data;
                if (!data?.accessToken) return null;
                localStorage.setItem('accessToken', data.accessToken);
                if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
                if (data.user) localStorage.setItem('authUser', JSON.stringify(data.user));
                return data.accessToken as string;
            })
            .catch(() => null)
            .finally(() => {
                refreshPromise = null;
            });
    }
    return refreshPromise;
}

const AUTH_ENDPOINTS_EXEMPT_FROM_REFRESH: string[] = [AUTH_ENDPOINTS.LOGIN, AUTH_ENDPOINTS.REGISTER, AUTH_ENDPOINTS.REFRESH];

export async function apiRequest<T = unknown>(endpoint: string, options: RequestOptions = {}, isRetry = false): Promise<T> {
    const token = getToken();
    // FormData (file uploads) must be sent as-is, with the browser setting its own
    // multipart Content-Type (including the boundary) — never JSON.stringify it.
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

    const headers: Record<string, string> = {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(options.headers as Record<string, string> | undefined),
    };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        body: isFormData ? (options.body as FormData) : options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json') ? await response.json().catch(() => null) : await response.text();

    if (!response.ok) {
        if ((response.status === 401 || response.status === 403) && !isRetry && !AUTH_ENDPOINTS_EXEMPT_FROM_REFRESH.includes(endpoint)) {
            const newAccessToken = await refreshAccessToken();
            if (newAccessToken) {
                return apiRequest<T>(endpoint, options, true);
            }
            clearStoredSession();
        }

        const message = (payload && typeof payload === 'object' && 'message' in (payload as Record<string, unknown>) && (payload as Record<string, unknown>).message) || response.statusText || 'Request failed';
        throw new ApiError(String(message), response.status, payload);
    }

    return payload as T;
}

export const apiGet = <T>(endpoint: string, options?: RequestOptions) => apiRequest<T>(endpoint, { ...options, method: 'GET' });
export const apiPost = <T>(endpoint: string, body?: unknown, options?: RequestOptions) => apiRequest<T>(endpoint, { ...options, method: 'POST', body });
export const apiPut = <T>(endpoint: string, body?: unknown, options?: RequestOptions) => apiRequest<T>(endpoint, { ...options, method: 'PUT', body });
export const apiPatch = <T>(endpoint: string, body?: unknown, options?: RequestOptions) => apiRequest<T>(endpoint, { ...options, method: 'PATCH', body });
export const apiDelete = <T>(endpoint: string, body?: unknown, options?: RequestOptions) => apiRequest<T>(endpoint, { ...options, method: 'DELETE', body });
