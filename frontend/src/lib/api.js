import { supabase } from './supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(path, options = {}) {
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }

  return res.json();
}

export const api = {
  // Customers
  getCustomers: (search = '') =>
    request(`/api/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getCustomer: (id) => request(`/api/customers/${id}`),

  // Sales
  recordSale: (sale) =>
    request('/api/sales', { method: 'POST', body: JSON.stringify(sale) }),
  getSales: (from, to) =>
    request(`/api/sales?from=${from || ''}&to=${to || ''}`),

  // Dashboard
  getDashboard: (from, to) =>
    request(`/api/dashboard?from=${from || ''}&to=${to || ''}`),
};
