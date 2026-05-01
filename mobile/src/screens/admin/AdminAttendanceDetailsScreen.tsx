import React, { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { AdminAttendance } from '../../types';
import { colors } from '../../styles/theme';

export const AdminAttendanceDetailsScreen = ({ route }: any) => {
  const title: string = route?.params?.title ?? 'Attendance Details';
  const date: string = route?.params?.date ?? '';
  const subject: string = route?.params?.subject ?? 'N/A';
  const records: AdminAttendance[] = Array.isArray(route?.params?.records) ? route.params.records : [];

  const sortedRecords = useMemo(
    () => [...records].sort((a, b) => a.scannedAt.localeCompare(b.scannedAt)),
    [records]
  );

  return (
    <View style={styles.container}>
      <Surface style={styles.headerCard} elevation={1}>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerMeta}>Date: {date || 'N/A'}</Text>
        <Text style={styles.headerMeta}>Subject: {subject || 'N/A'}</Text>
        <Text style={styles.headerMeta}>Total: {sortedRecords.length}</Text>
      </Surface>

      <FlatList
        data={sortedRecords}
        keyExtractor={(item, index) => `${item.scholarNumber}-${item.scannedAt}-${index}`}
        ListEmptyComponent={<Text style={styles.empty}>No attendance records found.</Text>}
        renderItem={({ item }) => (
          <Surface style={styles.card} elevation={1}>
            <Text style={styles.name}>{item.studentName} ({item.scholarNumber})</Text>
            <Text style={styles.meta}>Enrollment: {item.enrollmentNumber}</Text>
            <Text style={styles.meta}>Teacher: {item.teacherName} [{item.teacherCode}]</Text>
            <Text style={styles.meta}>Time: {new Date(item.scannedAt).toLocaleString()}</Text>
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
