import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { AttendanceProvider } from './src/context/AttendanceContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { theme } from './src/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <AttendanceProvider>
            <StatusBar style="dark" />
            <RootNavigator />
          </AttendanceProvider>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
