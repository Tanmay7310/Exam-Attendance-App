import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Dialog, Portal, TextInput as PaperTextInput } from 'react-native-paper';
import { api } from '../../api/client';
import { ACR, AcropolisBackBar, EmptyState, HeroCard, Pill, ScreenShell, SectionLabel, initialsOf } from '../../components/AcropolisUI';
import { AdminSearchInput } from '../../components/AdminModuleUI';
import { ExportFormatDialog } from '../../components/ExportFormatDialog';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AdminAttendance, SessionAttendanceDetails, SessionAttendanceStudentRecord } from '../../types';
import { buildSessionAttendanceReportEndpoint, downloadAndShareAttendanceExport, ExportFormat, exportFormatLabel } from '../../utils/attendanceExport';
import { getApiErrorMessage, handleSessionExpired } from '../../utils/apiErrors';
import { useAppTheme } from '../../styles/appTheme';

export const AdminAttendanceDetailsScreen = ({ route, navigation }: any) => {
  const { auth, logout } = useAuth();
  const { showToast } = useToast();
  const theme = useAppTheme();
  const title: string = route?.params?.title ?? 'Attendance Details';
  const sessionId: number | undefined = route?.params?.sessionId;
  const date: string = route?.params?.date ?? '';
  const subject: string = route?.params?.subject ?? 'N/A';
  const records: AdminAttendance[] = Array.isArray(route?.params?.records) ? route.params.records : [];
  const [sessionDetails, setSessionDetails] = useState<SessionAttendanceDetails | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PRESENT' | 'ABSENT'>('ALL');
  const [search, setSearch] = useState('');
  const [pendingAdjustment, setPendingAdjustment] = useState<{ record: SessionAttendanceStudentRecord; status: 'PRESENT' | 'ABSENT' } | null>(null);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportDialogVisible, setExportDialogVisible] = useState(false);

  const loadSessionDetails = useCallback(async () => {
    if (!sessionId) return;
    const { data } = await api.get<SessionAttendanceDetails>(`/api/admin/attendance/sessions/${sessionId}`);
    setSessionDetails(data);
  }, [sessionId]);

  React.useEffect(() => {
    loadSessionDetails().catch(async (e: any) => {
      if (await handleSessionExpired(e, logout, showToast)) return;
      showToast(getApiErrorMessage(e, 'Unable to load session roster.'), { type: 'error' });
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
        teacherName: record.teacherName,
        teacherCode: record.teacherCode,
        adjusted: false
      }));
  }, [records, sessionDetails]);

  const presentCount = useMemo(
    () => resolvedRecords.filter((row) => row.status === 'PRESENT').length,
    [resolvedRecords]
  );
  const totalCount = resolvedRecords.length;
  const absentCount = Math.max(0, totalCount - presentCount);
  const attendancePct = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    return resolvedRecords.filter((row) => {
      const statusMatch = statusFilter === 'ALL' || row.status === statusFilter;
      const searchMatch = !q
        || row.studentName.toLowerCase().includes(q)
        || row.scholarNumber.toLowerCase().includes(q)
        || (row.enrollmentNumber ?? '').toLowerCase().includes(q);
      return statusMatch && searchMatch;
    });
  }, [resolvedRecords, search, statusFilter]);

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
      const { data } = await api.post<SessionAttendanceDetails>(`/api/admin/attendance/sessions/${sessionId}/adjust`, {
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

  const exportSession = async (format: ExportFormat) => {
    if (!sessionId) {
      showToast('Session ID is missing for this export.', { type: 'error' });
      return;
    }

    try {
      setExporting(true);
      const endpoint = buildSessionAttendanceReportEndpoint(format, 'ADMIN', sessionId);
      const { fileUri, shared } = await downloadAndShareAttendanceExport({
        endpoint,
        token: auth?.token,
        fileBaseName: `admin-attendance-session-${sessionId}-${sessionDetails?.subject || subject || 'report'}`,
        format
      });
      setExportDialogVisible(false);

      if (!shared) {
        showToast(`${exportFormatLabel(format)} saved at ${fileUri}`, { type: 'success', duration: 3200 });
      }
    } catch (e: any) {
      if (await handleSessionExpired(e, logout, showToast)) return;
      showToast(getApiErrorMessage(e, 'Unable to export this session.'), { type: 'error' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <ScreenShell>
      <AcropolisBackBar
        title="Session Details"
        subtitle={subject || 'Student Records'}
        onBack={() => navigation.goBack()}
        right={(
          <Pressable
            onPress={() => setExportDialogVisible(true)}
            disabled={exporting || !sessionId}
            style={({ pressed }) => [styles.exportPill, pressed && styles.pressed, (exporting || !sessionId) && styles.exportPillDisabled]}
          >
            <Text style={styles.exportPillText}>{exporting ? 'Exporting' : 'Export'}</Text>
          </Pressable>
        )}
      />
      <FlatList
        data={filteredRecords}
        keyExtractor={(item, index) => `${item.scholarNumber}-${item.status}-${item.adjustedAt ?? item.scannedAt ?? 'absent'}-${index}`}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <HeroCard>
              <View style={styles.heroRow}>
                <View style={styles.heroCopy}>
                  <Text style={styles.heroKicker}>Session</Text>
                  <Text style={styles.heroTitle}>{subject || 'N/A'}</Text>
                  <Text style={styles.heroMeta}>{date || 'N/A'}</Text>
                </View>
                <View style={styles.recordsBox}>
                  <Text style={styles.recordsValue}>{presentCount}/{totalCount}</Text>
                  <Text style={styles.recordsLabel}>Present</Text>
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
              <View style={[styles.legacyBanner, { backgroundColor: theme.amberSoft, borderColor: theme.gold }]}>
                <Text style={[styles.legacyText, { color: theme.goldDeep }]}>Absent list unavailable for this legacy session.</Text>
              </View>
            ) : null}

            <View style={[styles.toolsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <AdminSearchInput value={search} onChangeText={setSearch} placeholder="Search by student or scholar number" />
              <View style={styles.filterRow}>
                <Pill label={`All (${totalCount})`} active={statusFilter === 'ALL'} onPress={() => setStatusFilter('ALL')} />
                <Pill label={`Present (${presentCount})`} active={statusFilter === 'PRESENT'} tone="green" onPress={() => setStatusFilter('PRESENT')} />
                <Pill label={`Absent (${absentCount})`} active={statusFilter === 'ABSENT'} tone="red" onPress={() => setStatusFilter('ABSENT')} />
              </View>
            </View>

            <SectionLabel title="Student Records" />
          </>
        }
        ListEmptyComponent={<EmptyState title="No attendance records found" />}
        renderItem={({ item }) => (
          <StudentRecord
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
            <Dialog visible onDismiss={closeAdjustment} style={[styles.dialog, { backgroundColor: theme.card }]}>
              <Dialog.Title>{pendingAdjustment.status === 'PRESENT' ? 'Mark Present' : 'Mark Absent'}</Dialog.Title>
              <Dialog.Content>
                <Text style={[styles.dialogText, { color: theme.muted }]}>
                  Update {pendingAdjustment.record.studentName} ({pendingAdjustment.record.scholarNumber}) to {pendingAdjustment.status}.
                </Text>
                <PaperTextInput
                  label="Reason"
                  mode="outlined"
                  value={adjustmentReason}
                  onChangeText={setAdjustmentReason}
                  style={[styles.dialogInput, { backgroundColor: theme.card }]}
                  textColor={theme.ink}
                  outlineColor={theme.border}
                  activeOutlineColor={theme.blue}
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
      <ExportFormatDialog
        visible={exportDialogVisible}
        exporting={exporting}
        onDismiss={() => setExportDialogVisible(false)}
        onSelect={exportSession}
      />
    </ScreenShell>
  );
};

const StatTile = ({ label, value, tone }: { label: string; value: number; tone: 'blue' | 'green' | 'red' }) => {
  const theme = useAppTheme();
  const color = tone === 'green' ? theme.green : tone === 'red' ? theme.rose : theme.blue;
  return (
    <View style={[styles.statTile, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.muted }]}>{label}</Text>
    </View>
  );
};

const StudentRecord = ({ item, canAdjust, onAdjust }: { item: SessionAttendanceStudentRecord; canAdjust: boolean; onAdjust: () => void }) => {
  const present = item.status === 'PRESENT';
  const theme = useAppTheme();
  return (
    <View style={[styles.studentCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
      <View style={[styles.avatarWrap, { backgroundColor: theme.isDark ? '#1B2142' : '#E0E7FF' }]}>
        <Text style={[styles.avatarText, { color: theme.isDark ? '#A5B4FC' : '#3730A3' }]}>{initialsOf(item.studentName)}</Text>
        <View style={[styles.statusDot, { borderColor: theme.card, backgroundColor: present ? theme.green : theme.rose }]} />
      </View>
      <View style={styles.studentCopy}>
        <Text style={[styles.studentName, { color: theme.ink }]} numberOfLines={1}>{item.studentName}</Text>
        <Text style={[styles.studentMeta, { color: theme.muted }]}>Scholar: {item.scholarNumber}</Text>
        {item.enrollmentNumber ? <Text style={[styles.studentMeta, { color: theme.muted }]}>Enrollment: {item.enrollmentNumber}</Text> : null}
        <Text style={[styles.studentTeacher, { color: theme.ghost }]}>{item.teacherName || 'N/A'} {item.teacherCode ? `| ${item.teacherCode}` : ''}</Text>
        {item.adjusted ? (
          <Text style={[styles.adjustedText, { color: theme.goldDeep }]}>Manually adjusted{item.adjustedBy ? ` by ${item.adjustedBy}` : ''}</Text>
        ) : null}
      </View>
      <View style={styles.statusCol}>
        <View style={[styles.badge, { backgroundColor: present ? theme.greenSoft : theme.roseSoft }]}>
          <Text style={[styles.badgeText, { color: present ? theme.green : theme.rose }]}>{present ? 'Present' : 'Absent'}</Text>
        </View>
        {item.scannedAt ? <Text style={[styles.timeText, { color: theme.ghost }]}>{new Date(item.scannedAt).toLocaleString()}</Text> : null}
        <Pressable
          onPress={onAdjust}
          disabled={!canAdjust}
          style={({ pressed }) => [styles.adjustButton, { backgroundColor: theme.blueSoft, borderColor: theme.blue }, !canAdjust && { backgroundColor: theme.cardAlt, borderColor: theme.border }, pressed && styles.pressed]}
        >
          <Text style={[styles.adjustButtonText, { color: canAdjust ? theme.blue : theme.ghost }]}>
            {present ? 'Mark Absent' : 'Mark Present'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 28 },
  heroRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  heroCopy: { flex: 1 },
  heroKicker: { color: ACR.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' },
  heroTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', marginTop: 5 },
  heroMeta: { color: '#BFD1FF', fontSize: 12, fontWeight: '700', marginTop: 5 },
  recordsBox: { alignItems: 'flex-end' },
  recordsValue: { color: '#FFFFFF', fontSize: 25, fontWeight: '900' },
  recordsLabel: { color: '#BFD1FF', fontSize: 10, fontWeight: '800' },
  progressTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 999, overflow: 'hidden', marginTop: 18 },
  progressFill: { height: '100%', backgroundColor: '#FFFFFF', borderRadius: 999 },
  progressLabel: { color: '#DCE7FF', marginTop: 8, fontSize: 12, fontWeight: '800' },
  exportPill: { minHeight: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  exportPillDisabled: { opacity: 0.55 },
  exportPillText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
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
  statusCol: { alignItems: 'flex-end', maxWidth: 94 },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  presentBadge: { backgroundColor: '#ECFDF5' },
  absentBadge: { backgroundColor: '#FEF2F2' },
  badgeText: { fontSize: 11, fontWeight: '900' },
  presentText: { color: ACR.green },
  absentText: { color: ACR.rose },
  timeText: { color: ACR.ghost, fontSize: 9, fontWeight: '800', marginTop: 6, textAlign: 'right' },
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
