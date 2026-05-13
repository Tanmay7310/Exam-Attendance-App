import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Surface, Text, TextInput, TouchableRipple } from 'react-native-paper';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { AttendanceRecord } from '../../types';
import { colors } from '../../styles/theme';

const formatDateToDdMmYyyy = (date: string) => {
  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return date;
  }
  return `${match[3]}-${match[2]}-${match[1]}`;
};

export const AttendanceListScreen = ({ navigation }: any) => {
  const { showToast } = useToast();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [dateSearch, setDateSearch] = useState('');
  const [subjectSearch, setSubjectSearch] = useState('');

  const fetchRecords = useCallback(async () => {
    const { data } = await api.get<AttendanceRecord[]>('/api/teacher/attendance/history');
    setRecords(data);
  }, []);

  React.useEffect(() => {
    fetchRecords().catch(() => showToast('Failed to load attendance list.', { type: 'error' }));
  }, [fetchRecords, showToast]);

  const sessions = useMemo(() => {
    const grouped = new Map<string, { title: string; date: string; subject: string; data: AttendanceRecord[] }>();

    records.forEach((record) => {
      const date = record.date ?? new Date(record.scannedAt).toISOString().slice(0, 10);
      const subject = record.subject?.trim() || 'N/A';
      const examYear = record.examYear?.trim() || 'N/A';
      const examSemester = record.examSemester?.trim() || 'N/A';
      const examBranch = record.examBranch?.trim() || 'N/A';
      const examSection = record.examSection?.trim() || 'N/A';
      const context = `Y${examYear} S${examSemester} | ${examBranch} | Sec ${examSection}`;
      const key = `${date}::${subject}::${examYear}::${examSemester}::${examBranch}::${examSection}`;
      const title = `Date: ${date} | Subject: ${subject} | ${context}`;

      if (!grouped.has(key)) {
        grouped.set(key, { title, date, subject, data: [] });
      }
      grouped.get(key)?.data.push(record);
    });

    return Array.from(grouped.values())
      .sort((a, b) => {
        if (a.date !== b.date) {
          return b.date.localeCompare(a.date);
        }
        return a.subject.localeCompare(b.subject);
      })
      .map((group) => ({
        title: `Date: ${formatDateToDdMmYyyy(group.date)} | Subject: ${group.subject}`,
        date: group.date,
        displayDate: formatDateToDdMmYyyy(group.date),
        subject: group.subject,
        count: group.data.length,
        records: group.data.sort((a, b) => a.scannedAt.localeCompare(b.scannedAt))
      }));
  }, [records]);

  const filteredSessions = useMemo(() => {
    const normalizedDate = dateSearch.trim().toLowerCase();
    const normalizedSubject = subjectSearch.trim().toLowerCase();

    return sessions.filter((session) => {
      const dateMatch = !normalizedDate
        || session.displayDate.toLowerCase().includes(normalizedDate)
        || session.date.toLowerCase().includes(normalizedDate);
      const subjectMatch = !normalizedSubject || session.subject.toLowerCase().includes(normalizedSubject);
      return dateMatch && subjectMatch;
    });
  }, [dateSearch, sessions, subjectSearch]);

  return (
    <View style={styles.container}>
      <TextInput
        label="Search by Date (DD-MM-YYYY)"
        mode="outlined"
        value={dateSearch}
        onChangeText={setDateSearch}
        style={styles.input}
      />
      <TextInput
        label="Search by Subject"
        mode="outlined"
        value={subjectSearch}
        onChangeText={setSubjectSearch}
        style={styles.input}
      />

      <FlatList
        data={filteredSessions}
        keyExtractor={(item) => `${item.date}::${item.subject}`}
        ListEmptyComponent={<Text style={styles.empty}>No attendance entries found.</Text>}
        renderItem={({ item }) => (
          <Surface style={styles.sectionHeader} elevation={1}>
            <TouchableRipple
              style={styles.sectionPress}
              onPress={() =>
                navigation.navigate('AttendanceSessionDetails', {
                  title: item.title,
                  date: item.date,
                  subject: item.subject,
                  examYear: item.records[0]?.examYear ?? '',
                  examSemester: item.records[0]?.examSemester ?? '',
                  examBranch: item.records[0]?.examBranch ?? '',
                  examSection: item.records[0]?.examSection ?? '',
                  records: item.records
                })
              }
            >
              <View>
                <Text style={styles.sectionHeaderText}>{item.title}</Text>
                <Text style={styles.sectionMeta}>{item.count} student{item.count === 1 ? '' : 's'}</Text>
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
    marginBottom: 8
  },
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
