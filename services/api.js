import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// API Base URL - Automatically detect platform
// IMPORTANT: For real device, change this IP to your computer's IP address
// You can find it by running: ipconfig (Windows) or ifconfig (Mac/Linux)
const API_HOST = "192.168.3.188";
const getApiBaseUrl = () => {
  if (Platform.OS === "web") {
    return "http://localhost:3000/api/v1";
  } else if (Platform.OS === "android") {
    // ✅ Works for both emulator and real device on same WiFi
    return `http://${API_HOST}:3000/api/v1`;
  } else if (Platform.OS === "ios") {
    return `http://${API_HOST}:3000/api/v1`;
  } else {
    return "http://localhost:3000/api/v1";
  }
};

const API_BASE_URL = getApiBaseUrl();

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Add token to requests
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      // Error getting token
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem("userToken");
      await AsyncStorage.removeItem("user");
      // Navigate to login - handled by AuthContext
    }

    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      "Network error";
    return Promise.reject(new Error(errorMessage));
  },
);

export default api;
