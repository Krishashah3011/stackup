import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('stackup_token');
    const savedUser = localStorage.getItem('stackup_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const saveAuth = (token, user) => {
    localStorage.setItem('stackup_token', token);
    localStorage.setItem('stackup_user', JSON.stringify(user));
    setToken(token);
    setUser(user);
  };

  const register = useCallback(async (formData) => {
    const { data } = await authService.register(formData);
    saveAuth(data.token, data.user);
    toast.success(`Welcome to StackUp AI, ${data.user.name}! 🎉`);
    return data;
  }, []);

  const login = useCallback(async (formData) => {
    const { data } = await authService.login(formData);
    saveAuth(data.token, data.user);
    toast.success(`Welcome back, ${data.user.name}!`);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('stackup_token');
    localStorage.removeItem('stackup_user');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  }, []);

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
