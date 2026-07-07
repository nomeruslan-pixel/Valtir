import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserState {
  name: string;
  email: string;
  notificationsEnabled: boolean;
  darkMode: boolean;
  updateProfile: (name: string, email: string) => void;
  toggleNotifications: () => void;
  toggleDarkMode: () => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      name: 'Sabyr',
      email: 'sabyr@example.com',
      notificationsEnabled: true,
      darkMode: false,

      updateProfile: (name, email) => set({ name, email }),
      
      toggleNotifications: () => set((state) => ({ 
        notificationsEnabled: !state.notificationsEnabled 
      })),
      
      toggleDarkMode: () => set((state) => ({ 
        darkMode: !state.darkMode 
      })),
      
      logout: () => set({
        name: 'Guest User',
        email: 'guest@example.com',
        notificationsEnabled: false,
        darkMode: false,
      }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
