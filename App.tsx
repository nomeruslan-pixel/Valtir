import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { QueryProvider } from './src/app/providers/QueryProvider';
import { RootNavigator } from './src/app/navigation/RootNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from './src/components/ErrorBoundary';

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden');
      NavigationBar.setBehaviorAsync('overlay-swipe');
    }
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <QueryProvider>
          <RootNavigator />
        </QueryProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
