import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Button, Surface, Text } from 'react-native-paper';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { buttonStyles } from '../../styles/buttonStyles';
import { AttendanceRecord, SessionAttendanceDetails, SessionAttendanceStudentRecord } from '../../types';
import { colors } from '../../styles/theme';

export const AttendanceSessionDetailsScreen = ({ route }: any) => {
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
        teacherCode: ''
      }));
  }, [sessionDetails, records]);

  const presentCount = useMemo(
    () => resolvedRecords.filter((row) => row.status === 'PRESENT').length,
    [resolvedRecords]
  );
  const totalCount = resolvedRecords.length;
  const absentCount = Math.max(0, totalCount - presentCount);
  const filteredRecords = useMemo(
    () => (statusFilter === 'ALL' ? resolvedRecords : resolvedRecords.filter((row) => row.status === statusFilter)),
    [resolvedRecords, statusFilter]
  );

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
      showToast(e?.response?.data?.message ?? 'Unable to generate PDF', { type: 'error' });
    }
  };

  return (
    <View style={styles.container}>
      <Surface style={styles.headerCard} elevation={1}>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerMeta}>Date: {date || 'N/A'}</Text>
        <Text style={styles.headerMeta}>Subject: {subject || 'N/A'}</Text>
        {examYear || examSemester || examBranch || examSection ? (
          <Text style={styles.headerMeta}>
            Class: Y{examYear || 'N/A'} S{examSemester || 'N/A'} | {examBranch || 'N/A'} | Sec {examSection || 'N/A'}
          </Text>
        ) : null}
        <Text style={styles.headerMeta}>Present: {presentCount}</Text>
        <Text style={styles.headerMeta}>Absent: {absentCount}</Text>
        <Text style={styles.headerMeta}>Total: {totalCount}</Text>
        {sessionDetails && !sessionDetails.rosterResolved ? (
          <Text style={styles.headerInfo}>Absent list unavailable for this legacy session.</Text>
        ) : null}
        <View style={styles.filterRow}>
          <Button
            mode={statusFilter === 'ALL' ? 'contained' : 'outlined'}
            compact
            onPress={() => setStatusFilter('ALL')}
            style={styles.filterBtn}
          >
            All
          </Button>
          <Button
            mode={statusFilter === 'PRESENT' ? 'contained' : 'outlined'}
            compact
            onPress={() => setStatusFilter('PRESENT')}
            style={styles.filterBtn}
          >
            Present
          </Button>
          <Button
            mode={statusFilter === 'ABSENT' ? 'contained' : 'outlined'}
            compact
            onPress={() => setStatusFilter('ABSENT')}
            style={styles.filterBtn}
          >
            Absent
          </Button>
        </View>
        <Button mode="contained" style={styles.exportButton} contentStyle={buttonStyles.content} onPress={exportPdf}>
          Export PDF
        </Button>
      </Surface>

      <FlatList
        data={filteredRecords}
        keyExtractor={(item, index) => `${item.scholarNumber}-${item.scannedAt ?? 'absent'}-${index}`}
        ListEmptyComponent={<Text style={styles.empty}>No attendance entries found.</Text>}
        renderItem={({ item }) => (
          <Surface style={styles.card} elevation={1}>
            <Text style={styles.name}>{item.studentName}</Text>
            <Text style={styles.meta}>Scholar: {item.scholarNumber}</Text>
            {item.enrollmentNumber ? <Text style={styles.meta}>Enrollment: {item.enrollmentNumber}</Text> : null}
            <Text style={styles.meta}>Status: {item.status}</Text>
            {item.scannedAt ? <Text style={styles.meta}>Time: {new Date(item.scannedAt).toLocaleTimeString()}</Text> : null}
          </Surface>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: colors.bg },
  headerCard: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10
  },
  headerTitle: { color: colors.text, fontWeight: '700', marginBottom: 6 },
  headerMeta: { color: colors.textMuted, marginTop: 2 },
  headerInfo: { color: colors.textMuted, marginTop: 8, fontStyle: 'italic' },
  filterRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8
  },
  filterBtn: {
    flex: 1
  },
  exportButton: {
    marginTop: 10
  },
  card: {
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8
  },
  name: { fontWeight: '700', color: colors.text },
  meta: { color: colors.textMuted, marginTop: 2 },
  empty: { marginTop: 18, textAlign: 'center', color: colors.textMuted }
});
