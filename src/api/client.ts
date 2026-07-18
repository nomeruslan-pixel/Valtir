import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your actual local IP address or ngrok URL
// For Android Emulator, use http://10.0.2.2:8000
// For iOS Simulator, use http://localhost:8000
// For physical device, use your machine's local IP or ngrok
export const API_BASE_URL = 'http://10.0.2.2:8000'; // Default to Android Emulator

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the token automatically
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
