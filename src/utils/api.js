import axios from 'axios';

/**
 * API base URL resolution:
 *  1. VITE_API_URL env var  → use in production / staging  (e.g. https://api.habishop.com/api)
 *  2. Falls back to /api   → local dev with Vite proxy to localhost:5000
 */
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/* ── Request interceptor: attach access token ── */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err)
);

/* ── Response interceptor: auto-refresh token on 401 ── */
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    if (err.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        }).catch((e) => Promise.reject(e));
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = data.accessToken;
        localStorage.setItem('accessToken', newToken);
        api.defaults.headers.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);

/* ─────────────────────────────────────────────────────────────────────
   AUTH
───────────────────────────────────────────────────────────────────── */
export const authAPI = {
  register:     (data)  => api.post('/auth/register', data),
  login:        (data)  => api.post('/auth/login', data),
  logout:       ()      => api.post('/auth/logout'),
  getMe:        ()      => api.get('/auth/me'),
  refresh:      ()      => api.post('/auth/refresh'),
};

/* ─────────────────────────────────────────────────────────────────────
   PRODUCTS
───────────────────────────────────────────────────────────────────── */
export const productAPI = {
  getAll:        (params)     => api.get('/products', { params }),
  getById:       (id)         => api.get(`/products/${id}`),
  getRelated:    (id)         => api.get(`/products/${id}/related`),
  getFeatured:   ()           => api.get('/products/featured'),
  getNewArrivals:()           => api.get('/products/new-arrivals'),
  getBestSellers:()           => api.get('/products/best-sellers'),
  search:        (q, limit=6) => api.get('/products', { params: { keyword: q, limit, page: 1 } }),
  create:        (data)       => api.post('/products', data),
  update:        (id, data)   => api.put(`/products/${id}`, data),
  delete:        (id)         => api.delete(`/products/${id}`),
};

/* ─────────────────────────────────────────────────────────────────────
   CATEGORIES
───────────────────────────────────────────────────────────────────── */
export const categoryAPI = {
  getAll:    ()          => api.get('/categories'),
  getBySlug: (slug)      => api.get(`/categories/${slug}`),
  create:    (data)      => api.post('/categories', data),
  update:    (id, data)  => api.put(`/categories/${id}`, data),
  delete:    (id)        => api.delete(`/categories/${id}`),
};

/* ─────────────────────────────────────────────────────────────────────
   ORDERS
───────────────────────────────────────────────────────────────────── */
export const orderAPI = {
  create:        (data)        => api.post('/orders', data),
  getMyOrders:   (params)      => api.get('/orders/my', { params }),
  getById:       (id)          => api.get(`/orders/${id}`),
  pay:           (id, data)    => api.put(`/orders/${id}/pay`, data),
  cancel:        (id, data)    => api.put(`/orders/${id}/cancel`, data),
  // Admin
  getAll:        (params)      => api.get('/orders', { params }),
  updateStatus:  (id, data)    => api.put(`/orders/${id}/status`, data),
};

/* ─────────────────────────────────────────────────────────────────────
   CART
───────────────────────────────────────────────────────────────────── */
export const cartAPI = {
  get:    ()                => api.get('/cart'),
  add:    (data)            => api.post('/cart/add', data),
  update: (productId, data) => api.put(`/cart/item/${productId}`, data),
  remove: (productId)       => api.delete(`/cart/item/${productId}`),
  clear:  ()                => api.delete('/cart/clear'),
};

/* ─────────────────────────────────────────────────────────────────────
   WISHLIST
───────────────────────────────────────────────────────────────────── */
export const wishlistAPI = {
  get:    ()          => api.get('/wishlist'),
  toggle: (productId) => api.put(`/wishlist/${productId}`),
};

/* ─────────────────────────────────────────────────────────────────────
   REVIEWS
───────────────────────────────────────────────────────────────────── */
export const reviewAPI = {
  getForProduct: (productId, params) => api.get(`/reviews/product/${productId}`, { params }),
  create:        (productId, data)   => api.post(`/reviews/product/${productId}`, data),
  update:        (id, data)          => api.put(`/reviews/${id}`, data),
  delete:        (id)                => api.delete(`/reviews/${id}`),
  markHelpful:   (id)                => api.put(`/reviews/${id}/helpful`),
};

/* ─────────────────────────────────────────────────────────────────────
   USERS
───────────────────────────────────────────────────────────────────── */
export const userAPI = {
  getProfile:     ()              => api.get('/users/profile'),
  updateProfile:  (data)          => api.put('/users/profile', data),
  changePassword: (data)          => api.put('/users/change-password', data),
  addAddress:     (data)          => api.post('/users/addresses', data),
  updateAddress:  (id, data)      => api.put(`/users/addresses/${id}`, data),
  deleteAddress:  (id)            => api.delete(`/users/addresses/${id}`),
  // Admin
  getAll:         (params)        => api.get('/users', { params }),
  updateRole:     (id, data)      => api.put(`/users/${id}`, data),
  delete:         (id)            => api.delete(`/users/${id}`),
};

/* ─────────────────────────────────────────────────────────────────────
   COUPONS
───────────────────────────────────────────────────────────────────── */
export const couponAPI = {
  validate: (data)       => api.post('/coupons/validate', data),
  getAll:   ()           => api.get('/coupons'),
  create:   (data)       => api.post('/coupons', data),
  update:   (id, data)   => api.put(`/coupons/${id}`, data),
  delete:   (id)         => api.delete(`/coupons/${id}`),
};

/* ─────────────────────────────────────────────────────────────────────
   DASHBOARD
───────────────────────────────────────────────────────────────────── */
export const dashboardAPI = {
  get: () => api.get('/dashboard'),
};

/* ─────────────────────────────────────────────────────────────────────
   UPLOAD
───────────────────────────────────────────────────────────────────── */
export const uploadAPI = {
  uploadImages: (formData) =>
    api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  uploadSingle: (formData) =>
    api.post('/upload/single', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export default api;
