import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Keyboard, StyleSheet } from 'react-native';
import { Portal, Snackbar, Text } from 'react-native-paper';

type ToastType = 'success' | 'error' | 'info';

type ToastOptions = {
  type?: ToastType;
  duration?: number;
};

type ToastItem = {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
};

type ToastContextType = {
  showToast: (message: string, options?: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const DEFAULT_DURATION = 2200;

const getToastColor = (type: ToastType) => {
  if (type === 'success') return '#166534';
  if (type === 'error') return '#991B1B';
  return '#1E3A8A';
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [queue, setQueue] = useState<ToastItem[]>([]);
  const [currentToast, setCurrentToast] = useState<ToastItem | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const showToast = useCallback((message: string, options?: ToastOptions) => {
    const normalized = message.trim();
    if (!normalized) return;

    setQueue((prev) => [
      ...prev,
      {
        id: Date.now() + Math.floor(Math.random() * 1000),
        message: normalized,
        type: options?.type ?? 'info',
        duration: options?.duration ?? DEFAULT_DURATION
      }
    ]);
  }, []);

  React.useEffect(() => {
    if (currentToast || queue.length === 0) return;
    const [next, ...rest] = queue;
    setCurrentToast(next);
    setQueue(rest);
  }, [currentToast, queue]);

  React.useEffect(() => {
    const onShow = (event: any) => setKeyboardHeight(event?.endCoordinates?.height ?? 0);
    const onHide = () => setKeyboardHeight(0);

    const showSub = Keyboard.addListener('keyboardDidShow', onShow);
    const hideSub = Keyboard.addListener('keyboardDidHide', onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleDismiss = () => {
    setCurrentToast(null);
  };

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Portal>
        <Snackbar
          visible={!!currentToast}
          onDismiss={handleDismiss}
          duration={currentToast?.duration ?? DEFAULT_DURATION}
          wrapperStyle={[styles.wrapper, { bottom: keyboardHeight ? keyboardHeight + 12 : 12 }]}
          style={[styles.toast, { backgroundColor: getToastColor(currentToast?.type ?? 'info') }]}
        >
          <Text style={styles.message}>{currentToast?.message ?? ''}</Text>
        </Snackbar>
      </Portal>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
};

const styles = StyleSheet.create({
  wrapper: {
    left: 12,
    right: 12,
    position: 'absolute'
  },
  toast: {
    borderRadius: 10
  },
  message: {
    color: '#FFFFFF',
    fontWeight: '600'
  }
});
