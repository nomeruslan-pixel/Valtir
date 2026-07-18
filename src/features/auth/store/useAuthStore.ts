import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  token: string | null;
  user: any | null;
  isAuthenticated: boolean;
  setToken: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  setToken: async (token: string) => {
    await AsyncStorage.setItem('auth_token', token);
    set({ token, isAuthenticated: true });
  },
  logout: async () => {
    await AsyncStorage.removeItem('auth_token');
    set({ token: null, isAuthenticated: false, user: null });
  },
  checkAuth: async () => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      set({ token, isAuthenticated: true });
    } else {
      set({ token: null, isAuthenticated: false });
    }
  }
}));
