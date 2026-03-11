import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      // Error checking auth
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authService.signin(email, password);
      
      if (response.user) {
        setUser(response.user);
        await AsyncStorage.setItem('user', JSON.stringify(response.user));
      }
      
      if (response.token) {
        await AsyncStorage.setItem('userToken', response.token);
      }
      
      return response.user;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      // Still clear user on error
      setUser(null);
    }
  };

  const updateProfile = async (updates) => {
    try {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      
      return updatedUser;
    } catch (error) {
      throw error;
    }
  };

  // Lấy data mới nhất từ server (dùng khi cần hiển thị loyalty_points cập nhật)
  const refreshUser = async () => {
    try {
      const freshUser = await authService.getCurrentUser();
      if (freshUser) {
        setUser(freshUser);
        await AsyncStorage.setItem('user', JSON.stringify(freshUser));
      }
      return freshUser;
    } catch (error) {
      // Giữ nguyên user cũ nếu lỗi network
      console.warn('[AuthContext] refreshUser thất bại:', error.message);
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    updateProfile,
    refreshUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
