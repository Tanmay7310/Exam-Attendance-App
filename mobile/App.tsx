import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AppState } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { useAuth } from './src/context/AuthContext';
import { ToastProvider, useToast } from './src/context/ToastContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { paperTheme } from './src/styles/paperTheme';
import { flushOfflineScans } from './src/utils/offlineQueue';

const SyncListener = () => {
  const { showToast } = useToast();
  const { auth } = useAuth();

  const notifySyncResult = (result: { dropped: number; skipped: number }) => {
    if (result.dropped > 0) {
      showToast(`${result.dropped} invalid scan(s) were removed during sync.`, { type: 'info' });
    }
    if (result.skipped > 0) {
      showToast(`${result.skipped} queued scan(s) belong to another user and were not synced.`, { type: 'info' });
    }
  };

  useEffect(() => {
    flushOfflineScans(auth).then(notifySyncResult).catch(() => undefined);

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        flushOfflineScans(auth).then(notifySyncResult).catch(() => undefined);
      }
    });

    const intervalId = setInterval(() => {
      flushOfflineScans(auth).then(notifySyncResult).catch(() => undefined);
    }, 30000);

    return () => {
      subscription.remove();
      clearInterval(intervalId);
    };
  }, [auth, showToast]);

  return null;
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PaperProvider theme={paperTheme}>
          <ToastProvider>
            <SyncListener />
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </ToastProvider>
        </PaperProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
