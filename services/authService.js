import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const authService = {
  // Sign in
  signin: async (email, password) => {
    try {
      const response = await api.post('/auth/signin', { email, password });
      
      // Store user data
      if (response.data.user) {
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      // Store token if present in response
      if (response.data.token) {
        await AsyncStorage.setItem('userToken', response.data.token);
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Sign up
  signup: async (userData) => {
    try {
      const { fullName, email, password, phone } = userData;
      const response = await api.post('/auth/signup', {
        full_name: fullName,
        email,
        password,
        phone,
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Verify OTP
  verifyOTP: async (email, otp) => {
    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Resend OTP
  resendOTP: async (email) => {
    try {
      const response = await api.post('/auth/resend-otp', { email });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Forgot Password
  forgotPassword: async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Verify Password Reset OTP
  verifyPasswordResetOTP: async (email, otp) => {
    try {
      const response = await api.post('/auth/verify-password-reset-otp', { 
        email, 
        otp 
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Reset Password
  resetPassword: async (email, otp, newPassword) => {
    try {
      const response = await api.post('/auth/reset-password', {
        email,
        otp,
        newPassword,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Change Password (for logged in users)
  changePassword: async (oldPassword, newPassword) => {
    try {
      const response = await api.post('/auth/change-password', {
        oldPassword,
        newPassword,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/auth/logout');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('cart');
    } catch (error) {
      // Still clear local storage even if API call fails
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('cart');
      throw error;
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.user) {
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data.user;
    } catch (error) {
      throw error;
    }
  },
};

export default authService;
