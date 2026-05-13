import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Network from 'expo-network';
import { Button, Surface, Text, TextInput } from 'react-native-paper';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { buttonStyles } from '../../styles/buttonStyles';
import { colors } from '../../styles/theme';
import { createOfflineScanItem, enqueueOfflineScan, flushOfflineScans, getOfflineQueueSize, isOfflineError } from '../../utils/offlineQueue';

type ExamDetails = {
  subject: string;
  branch: string;
  semester: string;
  year: string;
  section: string;
};

export const ScanScreen = ({ route, navigation }: any) => {
  const { auth, logout } = useAuth();
  const { showToast } = useToast();
  const [permission, requestPermission] = useCameraPermissions();
  const [manualScholar, setManualScholar] = useState('');
  const [scanLock, setScanLock] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [confirmExit, setConfirmExit] = useState(false);
  const scanLockRef = useRef(false);
  const examDetails: ExamDetails | undefined = route?.params?.examDetails;
  const returnTo = route?.params?.returnTo ?? 'TeacherDashboard';

  const refreshPendingCount = useCallback(async () => {
    const size = await getOfflineQueueSize();
    setPendingCount(size);
  }, []);

  const tryFlush = useCallback(async () => {
    const result = await flushOfflineScans();
    if (result.dropped > 0) {
      showToast(`${result.dropped} invalid scan(s) were removed during sync.`, { type: 'info' });
    }
    await refreshPendingCount();
  }, [refreshPendingCount, showToast]);

  useEffect(() => {
    tryFlush().catch(() => undefined);
  }, [tryFlush]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        tryFlush().catch(() => undefined);
      }
    });

    return () => subscription.remove();
  }, [tryFlush]);

  useFocusEffect(
    useCallback(() => {
      tryFlush().catch(() => undefined);
      const intervalId = setInterval(() => {
        tryFlush().catch(() => undefined);
      }, 15000);

      return () => clearInterval(intervalId);
    }, [tryFlush])
  );

  const getErrorMessage = (e: any) => {
    const status = e?.response?.status;
    const body = e?.response?.data;

    if (status === 401 || status === 403) {
      return 'Session expired. Please login again.';
    }

    if (typeof body === 'string' && body.trim().length > 0) {
      return body;
    }

    return body?.message ?? body?.error ?? e?.message ?? `Request failed (${status ?? 'network'})`;
  };

  if (!examDetails) {
    return (
      <View style={styles.center}>
        <Text style={styles.blockedText}>Please enter exam details before scanning students.</Text>
        <Button mode="contained" style={styles.btn} contentStyle={buttonStyles.content} onPress={() => navigation.replace('EnterExamDetails', { returnTo })}>
          Go To Enter Exam Details
        </Button>
      </View>
    );
  }

  const submitScan = async (scholarNumber: string, caseSensitive = false) => {
    if (!scholarNumber.trim()) {
      showToast('Please enter a scholar number before submitting.', { type: 'info' });
      return;
    }

    const payload = {
      scholarNumber,
      examSubject: examDetails.subject,
      examYear: examDetails.year,
      examSemester: examDetails.semester,
      examBranch: examDetails.branch,
      examSection: examDetails.section,
      caseSensitive
    };

    try {
      const networkState = await Network.getNetworkStateAsync();
      const offline = networkState.isConnected === false || networkState.isInternetReachable === false;
      if (offline) {
        const role = auth?.role ?? 'TEACHER';
        const queuedCount = await enqueueOfflineScan(createOfflineScanItem(role, payload));
        setPendingCount(queuedCount);
        showToast('No internet connection. Attendance will sync when you are back online.', { type: 'info', duration: 3200 });
        return;
      }

      const scanEndpoint = auth?.role === 'ADMIN' ? '/api/admin/attendance/scan' : '/api/teacher/attendance/scan';
      const { data } = await api.post(scanEndpoint, payload);

      const name = data?.studentName ?? 'Student';
      const scholar = data?.scholarNumber ?? payload.scholarNumber;
      const baseMessage = data?.message?.trim() || 'marked present';
      const message = `${name} (${scholar}) ${baseMessage}`;
      showToast(message, { type: data?.duplicate ? 'info' : 'success', duration: 2600 });
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        showToast('Session expired. Please login again.', { type: 'error' });
        await logout();
        return;
      }

      if (isOfflineError(e)) {
        const role = auth?.role ?? 'TEACHER';
        const queuedCount = await enqueueOfflineScan(createOfflineScanItem(role, payload));
        setPendingCount(queuedCount);
        showToast('No internet connection. Attendance will sync when you are back online.', { type: 'info', duration: 3200 });
        return;
      }

      showToast(getErrorMessage(e), { type: 'error' });
    }
  };

  const onBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanLockRef.current || scanLock) {
      return;
    }
    scanLockRef.current = true;
    setScanLock(true);
    await submitScan(data.trim(), false);
    setTimeout(() => {
      scanLockRef.current = false;
      setScanLock(false);
    }, 1200);
  };

  const confirmDone = () => {
    if (!confirmExit) {
      setConfirmExit(true);
      showToast('Tap Done again to finish attendance.', { type: 'info' });
      setTimeout(() => setConfirmExit(false), 3000);
      return;
    }

    setConfirmExit(false);
    navigation.reset({
      index: 0,
      routes: [{ name: returnTo }]
    });
  };

  if (!permission) {
    return <View style={styles.center}><Text>Loading camera permissions...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={{ marginBottom: 10 }}>Camera permission is required for barcode scanning.</Text>
        <Button mode="contained" style={styles.btn} contentStyle={buttonStyles.content} onPress={requestPermission}>Allow Camera</Button>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
      <Surface style={styles.detailsCard} elevation={1}>
        <Text style={styles.detailsTitle}>Exam Details</Text>
        <Text style={styles.detailsLine}>Year: {examDetails.year}</Text>
        <Text style={styles.detailsLine}>Semester: {examDetails.semester}</Text>
        <Text style={styles.detailsLine}>Branch: {examDetails.branch}</Text>
        <Text style={styles.detailsLine}>Section: {examDetails.section}</Text>
        <Text style={styles.detailsLine}>Subject: {examDetails.subject}</Text>
      </Surface>

      <CameraView style={styles.camera} barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128', 'ean13'] }} onBarcodeScanned={onBarcodeScanned} />
      <Text style={styles.hint}>Point the camera at student barcode/QR containing Scholar Number.</Text>
      {pendingCount > 0 ? (
        <Text style={styles.pendingText}>Pending sync: {pendingCount}</Text>
      ) : null}

      <TextInput
        label="Manual Scholar Number"
        mode="outlined"
        style={styles.input}
        value={manualScholar}
        onChangeText={(text) => setManualScholar(text.toUpperCase())}
        autoCapitalize="characters"
        autoCorrect={false}
      />
      <Button mode="contained" style={styles.btn} contentStyle={buttonStyles.content} onPress={() => submitScan(manualScholar.trim(), true)}>
        Mark Attendance Manually
      </Button>

      <Button mode="contained" buttonColor={colors.danger} style={styles.doneBtn} contentStyle={buttonStyles.content} onPress={confirmDone}>
        Done
      </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 14, paddingBottom: 28 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  blockedText: { marginBottom: 12, color: colors.text, textAlign: 'center' },
  detailsCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10
  },
  detailsTitle: { color: colors.text, fontWeight: '700', marginBottom: 4 },
  detailsLine: { color: colors.textMuted, fontSize: 12 },
  camera: { width: '100%', height: 340, borderRadius: 16, overflow: 'hidden' },
  hint: { marginVertical: 12, color: colors.textMuted },
  pendingText: { marginBottom: 8, color: colors.textMuted, fontWeight: '600' },
  input: {
    marginBottom: 10
  },
  btn: {
    borderRadius: 12
  },
  doneBtn: {
    marginTop: 12,
    borderRadius: 12
  }
});
