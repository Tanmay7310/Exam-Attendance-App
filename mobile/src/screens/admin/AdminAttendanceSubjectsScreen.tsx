import React, { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Surface, Text, TouchableRipple } from 'react-native-paper';
import { AdminAttendance } from '../../types';
import { colors } from '../../styles/theme';

export const AdminAttendanceSubjectsScreen = ({ route, navigation }: any) => {
  const date: string = route?.params?.date ?? '';
  const records: AdminAttendance[] = Array.isArray(route?.params?.records) ? route.params.records : [];

  const subjects = useMemo(() => {
    const grouped = new Map<string, AdminAttendance[]>();

    records.forEach((record) => {
      const subject = record.subject?.trim() || 'N/A';
      if (!grouped.has(subject)) {
        grouped.set(subject, []);
      }
      grouped.get(subject)?.push(record);
    });

    return Array.from(grouped.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([subject, rows]) => ({
        subject,
        title: `Subject: ${subject}`,
        count: rows.length,
        records: rows.sort((a, b) => a.scannedAt.localeCompare(b.scannedAt))
      }));
  }, [records]);

  return (
    <View style={styles.container}>
      <Surface style={styles.headerCard} elevation={1}>
        <Text style={styles.headerTitle}>Date: {date || 'N/A'}</Text>
        <Text style={styles.headerMeta}>Select a subject to view records.</Text>
      </Surface>

      <FlatList
        data={subjects}
        keyExtractor={(item) => item.subject}
        ListEmptyComponent={<Text style={styles.empty}>No attendance records found.</Text>}
        renderItem={({ item }) => (
          <Surface style={styles.subjectCard} elevation={1}>
            <TouchableRipple
              style={styles.subjectPress}
              onPress={() =>
                navigation.navigate('AdminAttendanceDetails', {
                  title: `Date: ${date} | Subject: ${item.subject}`,
                  date,
                  subject: item.subject,
                  records: item.records
                })
              }
            >
              <View>
                <Text style={styles.subjectTitle}>{item.title}</Text>
                <Text style={styles.subjectMeta}>{item.count} record{item.count === 1 ? '' : 's'}</Text>
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
  headerCard: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10
  },
  headerTitle: { color: colors.text, fontWeight: '700', marginBottom: 4 },
  headerMeta: { color: colors.textMuted },
  subjectCard: {
    backgroundColor: colors.card,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8
  },
  subjectPress: { padding: 10 },
  subjectTitle: { color: colors.text, fontWeight: '700' },
  subjectMeta: { color: colors.textMuted, marginTop: 4 },
  empty: { marginTop: 18, textAlign: 'center', color: colors.textMuted }
});
