import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../utils/api';
import { getErrorMessage } from '../utils/helpers';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  const saveUser = (userData, token) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    if (token) localStorage.setItem('accessToken', token);
  };

  const clearUser = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
  };

  // Verify token on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      authAPI.getMe()
        .then(({ data }) => saveUser(data.user))
        .catch(() => clearUser())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    saveUser(data.user, data.accessToken);
    return data.user;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const { data } = await authAPI.register({ name, email, password });
    saveUser(data.user, data.accessToken);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try { await authAPI.logout(); } catch (_) {}
    clearUser();
    toast.success('Logged out successfully');
  }, []);

  const updateUser = useCallback((updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
  }, [user]);

  const isAdmin = user?.role === 'admin';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, isAdmin, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
