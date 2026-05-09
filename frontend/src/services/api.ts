import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// ── Token helpers ──────────────────────────────────────────────
export const getAccessToken = () => localStorage.getItem('access_token');
export const getRefreshToken = () => localStorage.getItem('refresh_token');
export const setTokens = (access: string, refresh: string) => {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
};
export const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};
export const storeUser = (u: any) => localStorage.setItem('user', JSON.stringify(u));
export const getStoredUser = () => {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
};

// ── Interceptors ───────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let failedQueue: { resolve: Function; reject: Function }[] = [];

const processQueue = (error: any, token: string | null) => {
  failedQueue.forEach((prom) => (error ? prom.reject(error) : prom.resolve(token)));
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }
      original._retry = true;
      isRefreshing = true;
      const refresh = getRefreshToken();
      if (refresh) {
        try {
          // SimpleJWT default refresh endpoint
          const res = await axios.post(`${API_BASE}/token/refresh/`, { refresh });
          const newAccess = res.data.access;
          localStorage.setItem('access_token', newAccess);
          processQueue(null, newAccess);
          original.headers.Authorization = `Bearer ${newAccess}`;
          return api(original);
        } catch (err) {
          processQueue(err, null);
          clearTokens();
          window.location.href = '/login';
        } finally {
          isRefreshing = false;
        }
      } else {
        clearTokens();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ───────────────────────────────────────────────────────
export const authAPI = {
  register: (data: { username: string; email: string; password: string; password2: string; first_name?: string; last_name?: string }) =>
    api.post('/register/', data),
  login: (data: { username: string; password: string }) =>
    api.post('/login/', data),
  logout: (refresh: string) =>
    api.post('/logout/', { refresh }),
};

// ── Dashboard ──────────────────────────────────────────────────
export const dashboardAPI = {
  get: () => api.get('/dashboard/'),
};

// ── Profiles ───────────────────────────────────────────────────
export const profilesAPI = {
  list: (params?: any) => api.get('/profiles/', { params }),
  create: (data: { accountType: string }) => api.post('/profiles/', data),
  detail: (id: number) => api.get(`/profiles/${id}/`),
  update: (id: number, data: any) => api.patch(`/profiles/${id}/`, data),
  delete: (id: number) => api.delete(`/profiles/${id}/`),
  summary: (id: number) => api.get(`/profiles/${id}/summary/`),
  monthly: (id: number) => api.get(`/profiles/${id}/monthly/`),
  monthlyDetail: (id: number, year: number, month: number) => api.get(`/profiles/${id}/monthly/${year}/${month}/`),
  expenses: (id: number, params?: any) => api.get(`/profiles/${id}/expenses/`, { params }),
};

// ── Categories ─────────────────────────────────────────────────
export const categoriesAPI = {
  list: (params?: any) => api.get('/categories/', { params }),
  create: (data: { name: string }) => api.post('/categories/', data),
  detail: (id: number) => api.get(`/categories/${id}/`),
  update: (id: number, data: { name: string }) => api.patch(`/categories/${id}/`, data),
  delete: (id: number) => api.delete(`/categories/${id}/`),
};

// ── Payment Info ───────────────────────────────────────────────
// Payment Info model removed

// ── Expenses ───────────────────────────────────────────────────
// CreateExpenseSerializer now takes payment_type and ref_id instead of payment_info_id
export const expensesAPI = {
  list: (params?: any) => api.get('/expenses/', { params }),
  create: (data: { profile_id: number; name: string; amount: number; category_id: number; payment_type?: string; ref_id?: string; comments?: string; timestamp?: string }) =>
    api.post('/expenses/', data),
  detail: (id: number) => api.get(`/expenses/${id}/`),
  update: (id: number, data: any) => api.patch(`/expenses/${id}/`, data),
  delete: (id: number) => api.delete(`/expenses/${id}/`),
};

// ── Incomes (NO category — Income model has no category field) ─
export const incomesAPI = {
  list: (params?: any) => api.get('/incomes/', { params }),
  create: (data: { name: string; amount: number; profile_id?: number; comments?: string; timestamp?: string }) =>
    api.post('/incomes/', data),
  detail: (id: number) => api.get(`/incomes/${id}/`),
  update: (id: number, data: any) => api.patch(`/incomes/${id}/`, data),
  delete: (id: number) => api.delete(`/incomes/${id}/`),
};

// ── Debts (requires category_id) ───────────────────────────────
export const debtsAPI = {
  list: (params?: any) => api.get('/debts/', { params }),
  create: (data: { name: string; amount: number; is_paid?: boolean; due_date?: string; comments?: string; timestamp?: string }) =>
    api.post('/debts/', data),
  detail: (id: number) => api.get(`/debts/${id}/`),
  update: (id: number, data: any) => api.patch(`/debts/${id}/`, data),
  delete: (id: number) => api.delete(`/debts/${id}/`),
};

export default api;
