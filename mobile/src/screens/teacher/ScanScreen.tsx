import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Network from 'expo-network';
import { Button, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../api/client';
import { ACR } from '../../components/AcropolisUI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { buttonStyles } from '../../styles/buttonStyles';
import { useAppTheme } from '../../styles/appTheme';
import { getApiErrorMessage, handleSessionExpired } from '../../utils/apiErrors';
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
  const theme = useAppTheme();
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
    const result = await flushOfflineScans(auth);
    if (result.dropped > 0) {
      showToast(`${result.dropped} invalid scan(s) were removed during sync.`, { type: 'info' });
    }
    if (result.skipped > 0) {
      showToast(`${result.skipped} queued scan(s) belong to another user and were not synced.`, { type: 'info' });
    }
    await refreshPendingCount();
  }, [auth, refreshPendingCount, showToast]);

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

  if (!examDetails) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Text style={[styles.blockedText, { color: theme.ink }]}>Please enter exam details before scanning students.</Text>
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
        const queuedCount = await enqueueOfflineScan(createOfflineScanItem(role, payload, auth?.username));
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
      if (await handleSessionExpired(e, logout, showToast)) return;

      if (isOfflineError(e)) {
        const role = auth?.role ?? 'TEACHER';
        const queuedCount = await enqueueOfflineScan(createOfflineScanItem(role, payload, auth?.username));
        setPendingCount(queuedCount);
        showToast('No internet connection. Attendance will sync when you are back online.', { type: 'info', duration: 3200 });
        return;
      }

      showToast(getApiErrorMessage(e, 'Scan request failed.'), { type: 'error' });
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
    return <View style={[styles.center, { backgroundColor: theme.bg }]}><Text style={{ color: theme.ink }}>Loading camera permissions...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Text style={[styles.permissionText, { color: theme.ink }]}>Camera permission is required for barcode scanning.</Text>
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
      <View style={styles.darkShell}>
        <SafeAreaView edges={['top']} style={styles.scanHeader}>
          <View style={styles.headerSpacer} />
          <View style={styles.scanTitleWrap}>
            <Text style={styles.scanTitle}>Scan Scholar Barcode</Text>
            <Text style={styles.scanSubtitle}>Aim at QR or barcode</Text>
          </View>
          <Pressable onPress={confirmDone} style={styles.donePill}>
            <Text style={styles.doneText}>Done</Text>
          </Pressable>
        </SafeAreaView>

        <View style={styles.sessionPill}>
          <Text style={styles.sessionPillText} numberOfLines={1}>
            Y{examDetails.year} S{examDetails.semester} | {examDetails.branch} | Sec {examDetails.section} | {examDetails.subject}
          </Text>
        </View>

        <View style={styles.cameraWrap}>
          <CameraView style={StyleSheet.absoluteFill} barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128', 'ean13'] }} onBarcodeScanned={onBarcodeScanned} />
          <View pointerEvents="none" style={styles.scanOverlay}>
            <Corner style={styles.cornerTopLeft} />
            <Corner style={styles.cornerTopRight} flipX />
            <Corner style={styles.cornerBottomLeft} flipY />
            <Corner style={styles.cornerBottomRight} flipX flipY />
            <View style={styles.scanLine} />
          </View>
        </View>

        <View style={styles.helperArea}>
          <Text style={styles.helperTitle}>{scanLock ? 'Processing scan...' : 'Scanner active'}</Text>
          <Text style={styles.helperText}>Point the camera at the scholar number barcode. Manual entry is available below.</Text>
          {pendingCount > 0 ? (
            <View style={styles.pendingBanner}>
              <Text style={styles.pendingText}>Pending sync: {pendingCount}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={[styles.manualSheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sheetTitle, { color: theme.ink }]}>Manual Scholar Entry</Text>
        <TextInput
          label="Manual Scholar Number"
          mode="outlined"
          style={[styles.input, { backgroundColor: theme.card }]}
          textColor={theme.ink}
          outlineColor={theme.border}
          activeOutlineColor={theme.blue}
          value={manualScholar}
          onChangeText={setManualScholar}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable onPress={() => submitScan(manualScholar.trim(), true)} style={({ pressed }) => [styles.manualButton, { backgroundColor: theme.blue, shadowColor: theme.blue }, pressed && styles.pressed]}>
          <Text style={styles.manualButtonText}>Mark Attendance Manually</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

const Corner = ({ style, flipX, flipY }: { style: any; flipX?: boolean; flipY?: boolean }) => (
  <View style={[styles.corner, style, flipX && styles.flipX, flipY && styles.flipY]}>
    <View style={styles.cornerHorizontal} />
    <View style={styles.cornerVertical} />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1220' },
  darkShell: { flex: 1, backgroundColor: '#0B1220', paddingHorizontal: 18 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  blockedText: { marginBottom: 12, textAlign: 'center' },
  permissionText: { marginBottom: 10, textAlign: 'center' },
  btn: { borderRadius: 12 },
  scanHeader: { minHeight: 80, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerSpacer: { width: 42, height: 42 },
  scanTitleWrap: { flex: 1, alignItems: 'center', paddingHorizontal: 10 },
  scanTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  scanSubtitle: { color: '#93A4C7', fontSize: 11, fontWeight: '700', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.8 },
  donePill: { minHeight: 42, borderRadius: 21, backgroundColor: ACR.blue, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  doneText: { color: '#FFFFFF', fontWeight: '900' },
  sessionPill: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 12, marginTop: 4 },
  sessionPillText: { color: '#DCE7FF', fontSize: 12, fontWeight: '800' },
  cameraWrap: { marginTop: 18, height: 330, borderRadius: 30, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', backgroundColor: '#111827' },
  scanOverlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  scanLine: { position: 'absolute', left: 44, right: 44, top: '50%', height: 2, backgroundColor: ACR.gold, shadowColor: ACR.gold, shadowOpacity: 0.7, shadowRadius: 8 },
  corner: { position: 'absolute', width: 44, height: 44 },
  cornerHorizontal: { width: 44, height: 4, borderRadius: 2, backgroundColor: '#FFFFFF' },
  cornerVertical: { width: 4, height: 44, borderRadius: 2, backgroundColor: '#FFFFFF', position: 'absolute', left: 0, top: 0 },
  cornerTopLeft: { top: 42, left: 42 },
  cornerTopRight: { top: 42, right: 42 },
  cornerBottomLeft: { bottom: 42, left: 42 },
  cornerBottomRight: { bottom: 42, right: 42 },
  flipX: { transform: [{ scaleX: -1 }] },
  flipY: { transform: [{ scaleY: -1 }] },
  helperArea: { alignItems: 'center', paddingVertical: 18 },
  helperTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  helperText: { color: '#93A4C7', textAlign: 'center', marginTop: 6, lineHeight: 18 },
  pendingBanner: { marginTop: 12, backgroundColor: 'rgba(212,175,55,0.14)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.35)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8 },
  pendingText: { color: '#FDE68A', fontWeight: '900' },
  manualSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 22, borderWidth: 1, borderColor: ACR.border },
  sheetTitle: { color: ACR.ink, fontSize: 18, fontWeight: '900', marginBottom: 12 },
  input: { marginBottom: 12, backgroundColor: '#FFFFFF' },
  manualButton: { minHeight: 56, borderRadius: 18, backgroundColor: ACR.blue, alignItems: 'center', justifyContent: 'center', shadowColor: ACR.blue, shadowOpacity: 0.22, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  manualButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.92 }
});
