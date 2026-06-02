import { QueryProvider } from './src/app/providers/QueryProvider';
import { RootNavigator } from './src/app/navigation/RootNavigator';

export default function App() {
  return (
    <QueryProvider>
      <RootNavigator />
    </QueryProvider>
  );
}
