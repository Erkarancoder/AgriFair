import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'jalrakshak_auth_user_v1';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {}
  }, [user]);

  // ── Email Login (UI-ready; wire to backend later) ──────────────────────────
  async function loginWithEmail(email, password) {
    setLoading(true);
    setError('');
    try {
      // TODO: replace with real API call → POST /api/jalrakshak/auth/login
      await new Promise((r) => setTimeout(r, 900)); // simulate network
      if (!email || !password) throw new Error('ईमेल और पासवर्ड डालें।');
      if (password.length < 6) throw new Error('पासवर्ड कम से कम 6 अक्षर का होना चाहिए।');

      // Mock successful login — replace with real token/user from backend
      const mockUser = {
        id: 'u_' + Date.now(),
        name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        email,
        avatar: null,
        provider: 'email',
        token: 'mock_jwt_token_' + Date.now(),
      };
      setUser(mockUser);
      return { success: true };
    } catch (err) {
      const msg = err.message || 'लॉगिन में समस्या आई। फिर कोशिश करें।';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }

  // ── Email Register ─────────────────────────────────────────────────────────
  async function registerWithEmail(name, email, password) {
    setLoading(true);
    setError('');
    try {
      // TODO: replace with real API call → POST /api/jalrakshak/auth/register
      await new Promise((r) => setTimeout(r, 1100));
      if (!name.trim()) throw new Error('अपना नाम डालें।');
      if (!email) throw new Error('ईमेल पता डालें।');
      if (password.length < 6) throw new Error('पासवर्ड कम से कम 6 अक्षर का होना चाहिए।');

      const mockUser = {
        id: 'u_' + Date.now(),
        name: name.trim(),
        email,
        avatar: null,
        provider: 'email',
        token: 'mock_jwt_token_' + Date.now(),
      };
      setUser(mockUser);
      return { success: true };
    } catch (err) {
      const msg = err.message || 'रजिस्ट्रेशन में समस्या आई।';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }

  // ── Google Login (UI-ready; wire Google OAuth later) ──────────────────────
  async function loginWithGoogle() {
    setLoading(true);
    setError('');
    try {
      // TODO: wire real Google OAuth → window.google.accounts.id.initialize(...)
      // For now simulate a Google user coming back
      await new Promise((r) => setTimeout(r, 1200));

      const mockGoogleUser = {
        id: 'google_' + Date.now(),
        name: 'Ramesh Kumar',
        email: 'ramesh.kumar@gmail.com',
        avatar: 'https://ui-avatars.com/api/?name=Ramesh+Kumar&background=16a34a&color=fff&size=64',
        provider: 'google',
        token: 'mock_google_token_' + Date.now(),
      };
      setUser(mockGoogleUser);
      return { success: true };
    } catch (err) {
      const msg = 'Google से लॉगिन नहीं हो पाया। फिर कोशिश करें।';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setUser(null);
    setError('');
  }

  function clearError() {
    setError('');
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, error, loginWithEmail, registerWithEmail, loginWithGoogle, logout, clearError }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

