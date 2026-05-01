import React, { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Button, Surface, Text } from 'react-native-paper';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { buttonStyles } from '../../styles/buttonStyles';
import { AttendanceRecord } from '../../types';
import { colors } from '../../styles/theme';

export const AttendanceSessionDetailsScreen = ({ route }: any) => {
  const { auth } = useAuth();
  const { showToast } = useToast();
  const title: string = route?.params?.title ?? 'Session Attendance';
  const date: string = route?.params?.date ?? '';
  const subject: string = route?.params?.subject ?? 'N/A';
  const records: AttendanceRecord[] = Array.isArray(route?.params?.records) ? route.params.records : [];

  const sortedRecords = useMemo(
    () => [...records].sort((a, b) => a.scannedAt.localeCompare(b.scannedAt)),
    [records]
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
        <Text style={styles.headerMeta}>Total: {sortedRecords.length}</Text>
        <Button mode="contained" style={styles.exportButton} contentStyle={buttonStyles.content} onPress={exportPdf}>
          Export PDF
        </Button>
      </Surface>

      <FlatList
        data={sortedRecords}
        keyExtractor={(item, index) => `${item.scholarNumber}-${item.scannedAt}-${index}`}
        ListEmptyComponent={<Text style={styles.empty}>No attendance entries found.</Text>}
        renderItem={({ item }) => (
          <Surface style={styles.card} elevation={1}>
            <Text style={styles.name}>{item.studentName}</Text>
            <Text style={styles.meta}>Scholar: {item.scholarNumber}</Text>
            {item.enrollmentNumber ? <Text style={styles.meta}>Enrollment: {item.enrollmentNumber}</Text> : null}
            <Text style={styles.meta}>Time: {new Date(item.scannedAt).toLocaleTimeString()}</Text>
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
