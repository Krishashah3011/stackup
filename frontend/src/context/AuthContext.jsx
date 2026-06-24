import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]     = useState(null);
  const [token, setToken]   = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Initialise from localStorage on first mount ───────────────────────────
  useEffect(() => {
    const savedToken = localStorage.getItem('stackup_token');
    const savedUser  = localStorage.getItem('stackup_user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        // Corrupted data — clear it
        localStorage.removeItem('stackup_token');
        localStorage.removeItem('stackup_user');
      }
    }
    setLoading(false);
  }, []);

  // ── Shared persist helper ─────────────────────────────────────────────────
  const persistAuth = (newToken, newUser) => {
    localStorage.setItem('stackup_token', newToken);
    localStorage.setItem('stackup_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  // ── Register ──────────────────────────────────────────────────────────────
  const register = useCallback(async (formData) => {
    const { data } = await authService.register(formData);
    persistAuth(data.token, data.user);
    toast.success(`Welcome to StackUp AI, ${data.user.name}! 🎉`);
    return data;
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (formData) => {
    const { data } = await authService.login(formData);
    persistAuth(data.token, data.user);
    toast.success(`Welcome back, ${data.user.name}!`);
    return data;
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('stackup_token');
    localStorage.removeItem('stackup_user');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  }, []);

  // ── Update Profile ────────────────────────────────────────────────────────
  const updateProfile = useCallback(async (formData) => {
    const { data } = await authService.updateProfile(formData);
    // Backend returns a fresh token + updated user
    persistAuth(data.token, data.user);
    toast.success('Profile updated successfully');
    return data;
  }, []);

  // ── Delete Account ────────────────────────────────────────────────────────
  const deleteAccount = useCallback(async (password) => {
    await authService.deleteAccount({ password });
    localStorage.removeItem('stackup_token');
    localStorage.removeItem('stackup_user');
    setToken(null);
    setUser(null);
    toast.success('Account deleted. Goodbye! 👋');
  }, []);

  // ── Refresh profile from server ───────────────────────────────────────────
  const refreshProfile = useCallback(async () => {
    try {
      const { data } = await authService.getProfile();
      const updated = data.user;
      localStorage.setItem('stackup_user', JSON.stringify(updated));
      setUser(updated);
      return updated;
    } catch {
      // Silently fail — stale data is acceptable
    }
  }, []);

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        register,
        login,
        logout,
        updateProfile,
        deleteAccount,
        refreshProfile,
      }}
    >
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