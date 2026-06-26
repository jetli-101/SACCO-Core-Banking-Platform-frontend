import { API_BASE_URL } from './baseUrl';

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

export async function apiRequest<T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const token = getToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> | undefined),
    };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json') ? await response.json().catch(() => null) : await response.text();

    if (!response.ok) {
        const message = (payload && typeof payload === 'object' && 'message' in (payload as Record<string, unknown>) && (payload as Record<string, unknown>).message) || response.statusText || 'Request failed';
        throw new ApiError(String(message), response.status, payload);
    }

    return payload as T;
}

export const apiGet = <T>(endpoint: string, options?: RequestOptions) => apiRequest<T>(endpoint, { ...options, method: 'GET' });
export const apiPost = <T>(endpoint: string, body?: unknown, options?: RequestOptions) => apiRequest<T>(endpoint, { ...options, method: 'POST', body });
export const apiPatch = <T>(endpoint: string, body?: unknown, options?: RequestOptions) => apiRequest<T>(endpoint, { ...options, method: 'PATCH', body });
export const apiDelete = <T>(endpoint: string, options?: RequestOptions) => apiRequest<T>(endpoint, { ...options, method: 'DELETE' });
