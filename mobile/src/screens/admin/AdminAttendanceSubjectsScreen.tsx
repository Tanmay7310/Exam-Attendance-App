import React, { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Surface, Text, TouchableRipple } from 'react-native-paper';
import { AdminAttendance } from '../../types';
import { colors } from '../../styles/theme';

export const AdminAttendanceSubjectsScreen = ({ route, navigation }: any) => {
  const date: string = route?.params?.date ?? '';
  const records: AdminAttendance[] = Array.isArray(route?.params?.records) ? route.params.records : [];

  const subjects = useMemo(() => {
    const grouped = new Map<string, { sessionId?: number; subject: string; rows: AdminAttendance[] }>();

    records.forEach((record) => {
      const subject = record.subject?.trim() || 'N/A';
      const key = record.sessionId != null
        ? `session:${record.sessionId}`
        : `${subject}:${record.teacherCode}:${record.examYear ?? ''}:${record.examSemester ?? ''}:${record.examBranch ?? ''}:${record.examSection ?? ''}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          sessionId: record.sessionId,
          subject,
          rows: []
        });
      }
      grouped.get(key)?.rows.push(record);
    });

    return Array.from(grouped.values())
      .sort((a, b) => a.subject.localeCompare(b.subject))
      .map((group) => ({
        sessionId: group.sessionId,
        subject: group.subject,
        title: `Subject: ${group.subject}`,
        meta: `Teacher: ${group.rows[0]?.teacherName ?? 'N/A'} [${group.rows[0]?.teacherCode ?? 'N/A'}]`,
        count: group.rows.length,
        records: group.rows.sort((a, b) => a.scannedAt.localeCompare(b.scannedAt))
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
        keyExtractor={(item, index) => item.sessionId != null ? `session:${item.sessionId}` : `${item.subject}:${index}`}
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
                  sessionId: item.sessionId,
                  records: item.records
                })
              }
            >
              <View>
                <Text style={styles.subjectTitle}>{item.title}</Text>
                <Text style={styles.subjectMeta}>{item.meta}</Text>
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
