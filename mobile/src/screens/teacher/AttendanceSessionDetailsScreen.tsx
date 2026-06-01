import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Button, Dialog, Portal, TextInput } from 'react-native-paper';
import { api } from '../../api/client';
import { ACR, AcropolisBackBar, EmptyState, HeroCard, Pill, ScreenShell, SectionLabel, initialsOf } from '../../components/AcropolisUI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AttendanceRecord, SessionAttendanceDetails, SessionAttendanceStudentRecord } from '../../types';
import { getApiErrorMessage, handleSessionExpired } from '../../utils/apiErrors';

export const AttendanceSessionDetailsScreen = ({ route, navigation }: any) => {
  const { auth, logout } = useAuth();
  const { showToast } = useToast();
  const title: string = route?.params?.title ?? 'Session Attendance';
  const sessionId: number | undefined = route?.params?.sessionId;
  const date: string = route?.params?.date ?? '';
  const subject: string = route?.params?.subject ?? 'N/A';
  const examYear: string = route?.params?.examYear ?? '';
  const examSemester: string = route?.params?.examSemester ?? '';
  const examBranch: string = route?.params?.examBranch ?? '';
  const examSection: string = route?.params?.examSection ?? '';
  const records: AttendanceRecord[] = Array.isArray(route?.params?.records) ? route.params.records : [];
  const [sessionDetails, setSessionDetails] = useState<SessionAttendanceDetails | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PRESENT' | 'ABSENT'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingAdjustment, setPendingAdjustment] = useState<{ record: SessionAttendanceStudentRecord; status: 'PRESENT' | 'ABSENT' } | null>(null);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  const loadSessionDetails = useCallback(async () => {
    if (!sessionId) return;
    const endpoint = auth?.role === 'ADMIN'
      ? `/api/admin/attendance/sessions/${sessionId}`
      : `/api/teacher/attendance/sessions/${sessionId}`;
    const { data } = await api.get<SessionAttendanceDetails>(endpoint);
    setSessionDetails(data);
  }, [auth?.role, sessionId]);

  React.useEffect(() => {
    loadSessionDetails().catch((e: any) => {
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        showToast('Session expired. Please login again.', { type: 'error' });
        logout().catch(() => undefined);
        return;
      }
      showToast(e?.response?.data?.message ?? 'Unable to load session roster.', { type: 'error' });
    });
  }, [loadSessionDetails, logout, showToast]);

  const resolvedRecords = useMemo<SessionAttendanceStudentRecord[]>(() => {
    if (sessionDetails?.records?.length) {
      return [...sessionDetails.records];
    }
    return [...records]
      .sort((a, b) => a.scannedAt.localeCompare(b.scannedAt))
      .map((record) => ({
        scholarNumber: record.scholarNumber,
        enrollmentNumber: record.enrollmentNumber,
        studentName: record.studentName,
        status: 'PRESENT',
        scannedAt: record.scannedAt,
        teacherName: '',
        teacherCode: '',
        adjusted: false
      }));
  }, [sessionDetails, records]);

  const presentCount = useMemo(
    () => resolvedRecords.filter((row) => row.status === 'PRESENT').length,
    [resolvedRecords]
  );
  const totalCount = resolvedRecords.length;
  const absentCount = Math.max(0, totalCount - presentCount);
  const attendancePct = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  const filteredRecords = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return resolvedRecords.filter((row) => {
      const matchesStatus = statusFilter === 'ALL' || row.status === statusFilter;
      const matchesSearch = !normalizedSearch
        || row.studentName.toLowerCase().includes(normalizedSearch)
        || row.scholarNumber.toLowerCase().includes(normalizedSearch)
        || (row.enrollmentNumber ?? '').toLowerCase().includes(normalizedSearch);
      return matchesStatus && matchesSearch;
    });
  }, [resolvedRecords, searchTerm, statusFilter]);

  const exportPdf = async () => {
    if (!date) {
      showToast('Date is missing for this session.', { type: 'error' });
      return;
    }

    try {
      const safeSubject = subject && subject !== 'N/A' ? subject.replace(/\s+/g, '-') : '';
      const fileSuffix = safeSubject ? `-${safeSubject}` : '';
      const fileUri = `${FileSystem.documentDirectory}attendance-${date}${fileSuffix}.pdf`;
      const queryParams = [`date=${encodeURIComponent(date)}`];
      if (subject && subject !== 'N/A') {
        queryParams.push(`subject=${encodeURIComponent(subject)}`);
      }
      if (examYear) {
        queryParams.push(`examYear=${encodeURIComponent(examYear)}`);
      }
      if (examSemester) {
        queryParams.push(`examSemester=${encodeURIComponent(examSemester)}`);
      }
      if (examBranch) {
        queryParams.push(`examBranch=${encodeURIComponent(examBranch)}`);
      }
      if (examSection) {
        queryParams.push(`examSection=${encodeURIComponent(examSection)}`);
      }
      const url = `${api.defaults.baseURL}/api/teacher/attendance/report/pdf?${queryParams.join('&')}`;
      await FileSystem.downloadAsync(url, fileUri, {
        headers: {
          Authorization: `Bearer ${auth?.token ?? ''}`
        }
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        showToast(`PDF saved at ${fileUri}`, { type: 'success', duration: 3200 });
      }
    } catch (e: any) {
      if (await handleSessionExpired(e, logout, showToast)) return;
      showToast(getApiErrorMessage(e, 'Unable to generate PDF'), { type: 'error' });
    }
  };

  const openAdjustment = (record: SessionAttendanceStudentRecord) => {
    const targetStatus = record.status === 'PRESENT' ? 'ABSENT' : 'PRESENT';
    setPendingAdjustment({ record, status: targetStatus });
    setAdjustmentReason(targetStatus === 'PRESENT' ? 'Barcode missed during scanning' : 'Marked absent after verification');
  };

  const closeAdjustment = () => {
    if (adjusting) return;
    setPendingAdjustment(null);
    setAdjustmentReason('');
  };

  const submitAdjustment = async () => {
    if (!sessionId || !pendingAdjustment) return;
    const reason = adjustmentReason.trim();
    if (!reason) {
      showToast('Please enter an adjustment reason.', { type: 'info' });
      return;
    }

    try {
      setAdjusting(true);
      const endpoint = auth?.role === 'ADMIN'
        ? `/api/admin/attendance/sessions/${sessionId}/adjust`
        : `/api/teacher/attendance/sessions/${sessionId}/adjust`;
      const { data } = await api.post<SessionAttendanceDetails>(endpoint, {
        scholarNumber: pendingAdjustment.record.scholarNumber,
        status: pendingAdjustment.status,
        reason
      });
      setSessionDetails(data);
      setPendingAdjustment(null);
      setAdjustmentReason('');
      showToast('Attendance updated successfully.', { type: 'success' });
    } catch (e: any) {
      if (await handleSessionExpired(e, logout, showToast)) return;
      showToast(getApiErrorMessage(e, 'Unable to update attendance.'), { type: 'error' });
    } finally {
      setAdjusting(false);
    }
  };

  return (
    <ScreenShell>
      <AcropolisBackBar
        title="Session Details"
        subtitle={subject || 'Attendance Records'}
        onBack={() => navigation.goBack()}
        right={
          <Pressable onPress={exportPdf} style={styles.exportPill}>
            <Text style={styles.exportPillText}>PDF</Text>
          </Pressable>
        }
      />
      <FlatList
        data={filteredRecords}
        keyExtractor={(item, index) => `${item.scholarNumber}-${item.status}-${item.adjustedAt ?? item.scannedAt ?? 'absent'}-${index}`}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <HeroCard>
              <View style={styles.heroRow}>
                <View style={styles.heroCopy}>
                  <Text style={styles.heroKicker}>Session</Text>
                  <Text style={styles.heroTitle}>{subject || 'N/A'}</Text>
                  <Text style={styles.heroMeta}>{date || 'N/A'} | Y{examYear || 'N/A'} S{examSemester || 'N/A'} | {examBranch || 'N/A'} | Sec {examSection || 'N/A'}</Text>
                </View>
                <View style={styles.heroCountBox}>
                  <Text style={styles.heroCount}>{presentCount}/{totalCount}</Text>
                  <Text style={styles.heroCountLabel}>Present</Text>
                </View>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${attendancePct}%` }]} />
              </View>
              <Text style={styles.progressLabel}>{attendancePct}% attendance</Text>
            </HeroCard>

            <View style={styles.statsRow}>
              <StatTile label="Present" value={presentCount} tone="green" />
              <StatTile label="Absent" value={absentCount} tone="red" />
              <StatTile label="Total" value={totalCount} tone="blue" />
            </View>

            {sessionDetails && !sessionDetails.rosterResolved ? (
              <View style={styles.legacyBanner}>
                <Text style={styles.legacyText}>Absent list unavailable for this legacy session.</Text>
              </View>
            ) : null}

            <View style={styles.toolsCard}>
              <TextInput
                label="Search by student or scholar number"
                mode="outlined"
                value={searchTerm}
                onChangeText={setSearchTerm}
                style={styles.input}
              />
              <View style={styles.filterRow}>
                <Pill label={`All (${totalCount})`} active={statusFilter === 'ALL'} onPress={() => setStatusFilter('ALL')} />
                <Pill label={`Present (${presentCount})`} active={statusFilter === 'PRESENT'} tone="green" onPress={() => setStatusFilter('PRESENT')} />
                <Pill label={`Absent (${absentCount})`} active={statusFilter === 'ABSENT'} tone="red" onPress={() => setStatusFilter('ABSENT')} />
              </View>
            </View>

            <SectionLabel title={statusFilter === 'ALL' ? 'All Scholars' : `${statusFilter.charAt(0)}${statusFilter.slice(1).toLowerCase()} Scholars`} />
          </>
        }
        ListEmptyComponent={<EmptyState title="No attendance entries found" subtitle="No students match the current filter." />}
        renderItem={({ item }) => (
          <StudentRow
            item={item}
            canAdjust={!!sessionDetails?.rosterResolved}
            onAdjust={() => openAdjustment(item)}
          />
        )}
      />
      <Portal>
        {pendingAdjustment ? (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.portalKeyboard}
            pointerEvents="box-none"
          >
            <Dialog visible onDismiss={closeAdjustment} style={styles.dialog}>
              <Dialog.Title>{pendingAdjustment.status === 'PRESENT' ? 'Mark Present' : 'Mark Absent'}</Dialog.Title>
              <Dialog.Content>
                <Text style={styles.dialogText}>
                  Update {pendingAdjustment.record.studentName} ({pendingAdjustment.record.scholarNumber}) to {pendingAdjustment.status}.
                </Text>
                <TextInput
                  label="Reason"
                  mode="outlined"
                  value={adjustmentReason}
                  onChangeText={setAdjustmentReason}
                  style={styles.dialogInput}
                  multiline
                  maxLength={255}
                />
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={closeAdjustment} disabled={adjusting}>Cancel</Button>
                <Button mode="contained" onPress={submitAdjustment} loading={adjusting} disabled={adjusting}>
                  Save
                </Button>
              </Dialog.Actions>
            </Dialog>
          </KeyboardAvoidingView>
        ) : null}
      </Portal>
    </ScreenShell>
  );
};

const StatTile = ({ label, value, tone }: { label: string; value: number; tone: 'blue' | 'green' | 'red' }) => (
  <View style={styles.statTile}>
    <Text style={[styles.statValue, tone === 'green' && styles.statGreen, tone === 'red' && styles.statRed]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const StudentRow = ({ item, canAdjust, onAdjust }: { item: SessionAttendanceStudentRecord; canAdjust: boolean; onAdjust: () => void }) => {
  const present = item.status === 'PRESENT';
  return (
    <View style={styles.studentCard}>
      <View style={styles.avatarWrap}>
        <Text style={styles.avatarText}>{initialsOf(item.studentName)}</Text>
        <View style={[styles.statusDot, present ? styles.statusDotPresent : styles.statusDotAbsent]} />
      </View>
      <View style={styles.studentCopy}>
        <Text style={styles.studentName} numberOfLines={1}>{item.studentName}</Text>
        <Text style={styles.studentMeta}>Scholar: {item.scholarNumber}</Text>
        {item.enrollmentNumber ? <Text style={styles.studentMeta}>Enrollment: {item.enrollmentNumber}</Text> : null}
        {item.teacherName || item.teacherCode ? <Text style={styles.studentTeacher}>{item.teacherName} {item.teacherCode ? `| ${item.teacherCode}` : ''}</Text> : null}
        {item.adjusted ? (
          <Text style={styles.adjustedText}>Manually adjusted{item.adjustedBy ? ` by ${item.adjustedBy}` : ''}</Text>
        ) : null}
      </View>
      <View style={styles.studentStatusCol}>
        <View style={[styles.statusBadge, present ? styles.presentBadge : styles.absentBadge]}>
          <Text style={[styles.statusBadgeText, present ? styles.presentBadgeText : styles.absentBadgeText]}>{present ? 'Present' : 'Absent'}</Text>
        </View>
        {item.scannedAt ? <Text style={styles.timeText}>{new Date(item.scannedAt).toLocaleTimeString()}</Text> : null}
        <Pressable
          onPress={onAdjust}
          disabled={!canAdjust}
          style={({ pressed }) => [styles.adjustButton, !canAdjust && styles.adjustButtonDisabled, pressed && styles.pressed]}
        >
          <Text style={[styles.adjustButtonText, !canAdjust && styles.adjustButtonTextDisabled]}>
            {present ? 'Mark Absent' : 'Mark Present'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  listContent: { padding: 18, paddingBottom: 28 },
  exportPill: { minHeight: 36, minWidth: 52, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  exportPillText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  heroRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  heroCopy: { flex: 1 },
  heroKicker: { color: ACR.gold, fontSize: 11, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' },
  heroTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', marginTop: 5 },
  heroMeta: { color: '#BFD1FF', fontSize: 12, fontWeight: '700', marginTop: 5, lineHeight: 17 },
  heroCountBox: { alignItems: 'flex-end' },
  heroCount: { color: '#FFFFFF', fontSize: 24, fontWeight: '900' },
  heroCountLabel: { color: '#BFD1FF', fontSize: 11, fontWeight: '800', marginTop: 2 },
  progressTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 999, overflow: 'hidden', marginTop: 18 },
  progressFill: { height: '100%', backgroundColor: '#FFFFFF', borderRadius: 999 },
  progressLabel: { color: '#DCE7FF', marginTop: 8, fontSize: 12, fontWeight: '800' },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  statTile: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: ACR.border, borderRadius: 18, padding: 13, alignItems: 'center' },
  statValue: { color: ACR.blue, fontSize: 20, fontWeight: '900' },
  statGreen: { color: ACR.green },
  statRed: { color: ACR.rose },
  statLabel: { color: ACR.muted, fontSize: 11, fontWeight: '800', marginTop: 3 },
  legacyBanner: { marginTop: 12, borderRadius: 16, borderWidth: 1, borderColor: '#FDE68A', backgroundColor: '#FFFBEB', padding: 12 },
  legacyText: { color: ACR.goldDeep, fontSize: 12, fontWeight: '800' },
  toolsCard: { marginTop: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: ACR.border, borderRadius: 22, padding: 12 },
  input: { backgroundColor: '#FFFFFF', marginBottom: 10 },
  filterRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  studentCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: ACR.border, borderRadius: 18, padding: 13, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#1C1917', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
  avatarWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E0E7FF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#3730A3', fontSize: 14, fontWeight: '900' },
  statusDot: { position: 'absolute', right: 0, bottom: 1, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#FFFFFF' },
  statusDotPresent: { backgroundColor: ACR.green },
  statusDotAbsent: { backgroundColor: ACR.rose },
  studentCopy: { flex: 1 },
  studentName: { color: ACR.ink, fontSize: 15, fontWeight: '900' },
  studentMeta: { color: ACR.muted, fontSize: 11, fontWeight: '700', marginTop: 2 },
  studentTeacher: { color: ACR.ghost, fontSize: 10, fontWeight: '700', marginTop: 3 },
  adjustedText: { color: ACR.goldDeep, fontSize: 10, fontWeight: '900', marginTop: 4 },
  studentStatusCol: { alignItems: 'flex-end' },
  statusBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  presentBadge: { backgroundColor: '#ECFDF5' },
  absentBadge: { backgroundColor: '#FEF2F2' },
  statusBadgeText: { fontSize: 11, fontWeight: '900' },
  presentBadgeText: { color: ACR.green },
  absentBadgeText: { color: ACR.rose },
  timeText: { color: ACR.ghost, fontSize: 10, fontWeight: '800', marginTop: 6 },
  adjustButton: { marginTop: 8, borderRadius: 999, borderWidth: 1, borderColor: ACR.blue, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: ACR.blueSoft },
  adjustButtonDisabled: { borderColor: ACR.border, backgroundColor: '#F5F5F4' },
  adjustButtonText: { color: ACR.blue, fontSize: 10, fontWeight: '900' },
  adjustButtonTextDisabled: { color: ACR.ghost },
  dialog: { backgroundColor: '#FFFFFF', borderRadius: 24 },
  portalKeyboard: { flex: 1, justifyContent: 'center' },
  dialogText: { color: ACR.muted, fontSize: 13, fontWeight: '700', marginBottom: 12 },
  dialogInput: { backgroundColor: '#FFFFFF' },
  pressed: { opacity: 0.85 }
});
