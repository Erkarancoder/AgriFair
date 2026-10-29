import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/auth.service';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check existing session on application load / refresh
  const checkAuth = useCallback(async () => {
    try {
      const response = await authService.getMe();
      if (response && response.success && response.user) {
        setUser(response.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    authService.getMe()
      .then((response) => {
        if (!ignore && response && response.success && response.user) {
          setUser(response.user);
        } else if (!ignore) {
          setUser(null);
        }
      })
      .catch(() => {
        if (!ignore) {
          setUser(null);
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    if (response.success && response.user) {
      setUser(response.user);
    }
    return response;
  };

  const register = async (userData) => {
    return await authService.register(userData);
  };

  const verifyOtp = async (data) => {
    const response = await authService.verifyOtp(data);
    if (response.success && response.user) {
      setUser(response.user);
    }
    return response;
  };

  const resendOtp = async (data) => {
    return await authService.resendOtp(data);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  };

  const forgotPassword = async (data) => {
    return await authService.forgotPassword(data);
  };

  const resetPassword = async (data) => {
    return await authService.resetPassword(data);
  };

  const updateProfile = async (data) => {
    const response = await authService.updateProfile(data);
    if (response.success && response.user) {
      setUser(response.user);
    }
    return response;
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    verifyOtp,
    resendOtp,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    checkAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
