import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Button, Surface, Text } from 'react-native-paper';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AdminAttendance, SessionAttendanceDetails, SessionAttendanceStudentRecord } from '../../types';
import { colors } from '../../styles/theme';

export const AdminAttendanceDetailsScreen = ({ route }: any) => {
  const { logout } = useAuth();
  const { showToast } = useToast();
  const title: string = route?.params?.title ?? 'Attendance Details';
  const sessionId: number | undefined = route?.params?.sessionId;
  const date: string = route?.params?.date ?? '';
  const subject: string = route?.params?.subject ?? 'N/A';
  const records: AdminAttendance[] = Array.isArray(route?.params?.records) ? route.params.records : [];
  const [sessionDetails, setSessionDetails] = useState<SessionAttendanceDetails | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PRESENT' | 'ABSENT'>('ALL');

  const loadSessionDetails = useCallback(async () => {
    if (!sessionId) return;
    const { data } = await api.get<SessionAttendanceDetails>(`/api/admin/attendance/sessions/${sessionId}`);
    setSessionDetails(data);
  }, [sessionId]);

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
        teacherName: record.teacherName,
        teacherCode: record.teacherCode
      }));
  }, [records, sessionDetails]);

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

  return (
    <View style={styles.container}>
      <Surface style={styles.headerCard} elevation={1}>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerMeta}>Date: {date || 'N/A'}</Text>
        <Text style={styles.headerMeta}>Subject: {subject || 'N/A'}</Text>
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
      </Surface>

      <FlatList
        data={filteredRecords}
        keyExtractor={(item, index) => `${item.scholarNumber}-${item.scannedAt ?? 'absent'}-${index}`}
        ListEmptyComponent={<Text style={styles.empty}>No attendance records found.</Text>}
        renderItem={({ item }) => (
          <Surface style={styles.card} elevation={1}>
            <Text style={styles.name}>{item.studentName} ({item.scholarNumber})</Text>
            <Text style={styles.meta}>Enrollment: {item.enrollmentNumber}</Text>
            <Text style={styles.meta}>Teacher: {item.teacherName || 'N/A'} [{item.teacherCode || 'N/A'}]</Text>
            <Text style={styles.meta}>Status: {item.status}</Text>
            {item.scannedAt ? <Text style={styles.meta}>Time: {new Date(item.scannedAt).toLocaleString()}</Text> : null}
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
