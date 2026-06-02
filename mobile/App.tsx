import React, { useEffect, useMemo } from 'react';
import { DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationDefaultTheme, NavigationContainer } from '@react-navigation/native';
import { AppState, useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { useAuth } from './src/context/AuthContext';
import { ToastProvider, useToast } from './src/context/ToastContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AppThemeProvider, appThemes, type ThemeMode } from './src/styles/appTheme';
import { getPaperTheme } from './src/styles/paperTheme';
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
  const colorScheme = useColorScheme();
  const mode: ThemeMode = colorScheme === 'dark' ? 'dark' : 'light';
  const tokens = appThemes[mode];
  const paperTheme = getPaperTheme(mode);
  const navigationTheme = useMemo(() => ({
    ...(mode === 'dark' ? NavigationDarkTheme : NavigationDefaultTheme),
    colors: {
      ...(mode === 'dark' ? NavigationDarkTheme.colors : NavigationDefaultTheme.colors),
      primary: tokens.blue,
      background: tokens.bg,
      card: tokens.card,
      text: tokens.ink,
      border: tokens.border,
      notification: tokens.rose
    }
  }), [mode, tokens]);

  return (
    <SafeAreaProvider>
      <AppThemeProvider tokens={tokens}>
        <AuthProvider>
          <PaperProvider theme={paperTheme}>
            <ToastProvider>
              <SyncListener />
              <NavigationContainer theme={navigationTheme}>
                <AppNavigator />
              </NavigationContainer>
            </ToastProvider>
          </PaperProvider>
        </AuthProvider>
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}
