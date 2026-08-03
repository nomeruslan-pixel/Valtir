import { create } from 'zustand';

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
    set({ token, isAuthenticated: true });
  },
  logout: async () => {
    set({ token: null, isAuthenticated: false, user: null });
  },
  checkAuth: async () => {
    // Session is no longer persisted, so checkAuth does nothing
    // User will always need to log in on app restart
    set((state) => ({ 
      token: state.token, 
      isAuthenticated: !!state.token 
    }));
  }
}));
