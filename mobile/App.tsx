import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AppState, KeyboardAvoidingView, Platform } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ToastProvider, useToast } from './src/context/ToastContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { paperTheme } from './src/styles/paperTheme';
import { flushOfflineScans } from './src/utils/offlineQueue';

const SyncListener = () => {
  const { showToast } = useToast();

  useEffect(() => {
    flushOfflineScans().then((result) => {
      if (result.dropped > 0) {
        showToast(`${result.dropped} invalid scan(s) were removed during sync.`, { type: 'info' });
      }
    }).catch(() => undefined);

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        flushOfflineScans().then((result) => {
          if (result.dropped > 0) {
            showToast(`${result.dropped} invalid scan(s) were removed during sync.`, { type: 'info' });
          }
        }).catch(() => undefined);
      }
    });

    const intervalId = setInterval(() => {
      flushOfflineScans().then((result) => {
        if (result.dropped > 0) {
          showToast(`${result.dropped} invalid scan(s) were removed during sync.`, { type: 'info' });
        }
      }).catch(() => undefined);
    }, 30000);

    return () => {
      subscription.remove();
      clearInterval(intervalId);
    };
  }, [showToast]);

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
              <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
              >
                <AppNavigator />
              </KeyboardAvoidingView>
            </NavigationContainer>
          </ToastProvider>
        </PaperProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
