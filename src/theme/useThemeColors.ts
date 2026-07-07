import { useUserStore } from '../features/user/store/useUserStore';
import { lightColors, darkColors } from './colors';

export const useThemeColors = () => {
  const { darkMode } = useUserStore();
  return darkMode ? darkColors : lightColors;
};
