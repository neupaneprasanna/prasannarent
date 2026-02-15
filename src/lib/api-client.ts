import { useAuthStore } from '@/store/auth-store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

type FetchOptions = RequestInit & {
    params?: Record<string, string>;
};

export const apiClient = {
    async fetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
        const { token } = useAuthStore.getState();
        const { params, ...customConfig } = options;

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...customConfig.headers,
        };

        const config: RequestInit = {
            ...customConfig,
            headers,
        };

        let url = `${API_BASE_URL}${endpoint}`;
        if (params) {
            const query = new URLSearchParams(params).toString();
            url += `?${query}`;
        }

        const response = await fetch(url, config);

        let data: any;
        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            throw new Error(`API Error: ${response.status} ${response.statusText}. Received non-JSON response.`);
        }

        if (response.ok) {
            return data as T;
        }

        const errorMessage = data?.details ? `${data.error}: ${data.details}` : (data?.error || `Request failed with status ${response.status}`);
        throw new Error(errorMessage);
    },

    get<T>(endpoint: string, options: FetchOptions = {}) {
        return this.fetch<T>(endpoint, { ...options, method: 'GET' });
    },

    post<T>(endpoint: string, body: any, options: FetchOptions = {}) {
        return this.fetch<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) });
    },

    put<T>(endpoint: string, body: any, options: FetchOptions = {}) {
        return this.fetch<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) });
    },

    patch<T>(endpoint: string, body: any, options: FetchOptions = {}) {
        return this.fetch<T>(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) });
    },

    delete<T>(endpoint: string, options: FetchOptions = {}) {
        return this.fetch<T>(endpoint, { ...options, method: 'DELETE' });
    },
};
