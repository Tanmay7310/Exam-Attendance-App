import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Button, Surface, Text, TextInput, TouchableRipple } from 'react-native-paper';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { buttonStyles } from '../../styles/buttonStyles';
import { AdminAttendance } from '../../types';
import { colors } from '../../styles/theme';

const isValidDateParam = (value: string) => {
  if (!value.trim()) return true;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsedUtc = new Date(Date.UTC(year, month - 1, day));

  return parsedUtc.getUTCFullYear() === year
    && parsedUtc.getUTCMonth() === month - 1
    && parsedUtc.getUTCDate() === day;
};

export const AttendanceMonitoringScreen = ({ navigation }: any) => {
  const { auth } = useAuth();
  const { showToast } = useToast();
  const [date, setDate] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [subject, setSubject] = useState('');
  const [rows, setRows] = useState<AdminAttendance[]>([]);

  const fetchRows = useCallback(async () => {
    const dateValue = date.trim();
    if (!isValidDateParam(dateValue)) {
      return;
    }

    const params: any = {};
    if (dateValue) params.date = dateValue;
    if (teacherId) params.teacherId = teacherId.trim();
    if (subject) params.subject = subject;

    const { data } = await api.get<AdminAttendance[]>('/api/admin/attendance', { params });
    setRows(data);
  }, [date, teacherId, subject]);

  React.useEffect(() => {
    fetchRows().catch(() => showToast('Failed to load attendance records.', { type: 'error' }));
  }, [fetchRows, showToast]);

  const exportPdf = async () => {
    try {
      const dateValue = date.trim();
      if (!isValidDateParam(dateValue)) {
        showToast('Please enter date in YYYY-MM-DD format.', { type: 'info' });
        return;
      }

      const params: string[] = [];
      if (dateValue) params.push(`date=${encodeURIComponent(dateValue)}`);
      if (teacherId) params.push(`teacherId=${encodeURIComponent(teacherId)}`);
      if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
      const query = params.length ? `?${params.join('&')}` : '';

      const fileUri = `${FileSystem.documentDirectory}admin-attendance-${Date.now()}.pdf`;
      const url = `${api.defaults.baseURL}/api/admin/attendance/report/pdf${query}`;

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

  const clearFilters = () => {
    setDate('');
    setTeacherId('');
    setSubject('');
  };

  const sessions = useMemo(() => {
    const grouped = new Map<string, { date: string; rows: AdminAttendance[] }>();

    rows.forEach((row) => {
      const rowDate = row.date;
      const key = rowDate;

      if (!grouped.has(key)) {
        grouped.set(key, { date: rowDate, rows: [] });
      }
      grouped.get(key)?.rows.push(row);
    });

    return Array.from(grouped.values())
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((group) => ({
        title: `Date: ${group.date}`,
        date: group.date,
        count: group.rows.length,
        records: group.rows.sort((a, b) => a.scannedAt.localeCompare(b.scannedAt))
      }));
  }, [rows]);

  return (
    <View style={styles.container}>
      <TextInput label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} style={styles.input} mode="outlined" />
      <TextInput label="Teacher (ID/Code/Name optional)" value={teacherId} onChangeText={setTeacherId} style={styles.input} mode="outlined" />
      <TextInput label="Subject (optional)" value={subject} onChangeText={setSubject} style={styles.input} mode="outlined" />
      <View style={styles.actionRow}>
        <Button mode="contained-tonal" style={styles.button} contentStyle={buttonStyles.content} onPress={clearFilters}>
          Clear Filters
        </Button>
        <Button mode="contained" style={styles.button} contentStyle={buttonStyles.content} onPress={exportPdf}>
          Export PDF
        </Button>
      </View>

      <FlatList
        style={{ marginTop: 10 }}
        data={sessions}
        keyExtractor={(item) => item.date}
        ListEmptyComponent={<Text style={styles.empty}>No attendance records found.</Text>}
        renderItem={({ item }) => (
          <Surface style={styles.sectionHeader} elevation={1}>
            <TouchableRipple
              style={styles.sectionPress}
              onPress={() =>
                navigation.navigate('AdminAttendanceSubjects', {
                  date: item.date,
                  records: item.records
                })
              }
            >
              <View>
                <Text style={styles.sectionHeaderText}>{item.title}</Text>
                <Text style={styles.sectionMeta}>{item.count} record{item.count === 1 ? '' : 's'}</Text>
              </View>
            </TouchableRipple>
          </Surface>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: colors.bg },
  input: {
    marginBottom: 7
  },
  actionRow: { flexDirection: 'row', gap: 8 },
  button: { flex: 1 },
  sectionHeader: {
    backgroundColor: colors.card,
    borderRadius: 10,
    marginTop: 8,
    marginBottom: 6,
    overflow: 'hidden'
  },
  sectionPress: { padding: 10 },
  sectionHeaderText: { color: colors.text, fontWeight: '700' },
  sectionMeta: { color: colors.textMuted, marginTop: 4 },
  empty: { marginTop: 18, textAlign: 'center', color: colors.textMuted }
});
