// API client for the admin dashboard backend proxy
// All requests go through the admin dashboard — no direct Shopify API calls

import { config } from '../constants/config';

const API_BASE = `${config.appUrl}/api/app`;

export async function apiFetch<T>(
  endpoint: string,
  options?: { method?: string; body?: any; params?: Record<string, string> }
): Promise<T> {
  let url = `${API_BASE}${endpoint}`;

  // Append query params
  if (options?.params) {
    const searchParams = new URLSearchParams(options.params);
    url += `?${searchParams.toString()}`;
  }

  const fetchOptions: RequestInit = {
    method: options?.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (options?.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API ${response.status}: ${text}`);
  }

  const json = await response.json();
  console.log('[API]', options?.method || 'GET', endpoint, '→', response.status);
  return json as T;
}

// Convenience helpers
export async function apiGet<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  return apiFetch<T>(endpoint, { params });
}

export async function apiPost<T>(endpoint: string, body: any): Promise<T> {
  return apiFetch<T>(endpoint, { method: 'POST', body });
}

export async function apiPatch<T>(endpoint: string, body: any): Promise<T> {
  return apiFetch<T>(endpoint, { method: 'PATCH', body });
}

// Higher-level service helpers
export const serviceApi = {
  returns: {
    create: (body: any) => apiPost('/returns', body),
    list: (user_id: string) => apiGet<any[]>('/returns', { user_id }),
    get: (id: string) => apiGet(`/returns/${id}`),
  },
  exchanges: {
    create: (body: any) => apiPost('/exchanges', body),
    list: (user_id: string) => apiGet<any[]>('/exchanges', { user_id }),
    get: (id: string) => apiGet(`/exchanges/${id}`),
  }
};
