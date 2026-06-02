import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { TextInput } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../api/client';
import { ACR, AcropolisBackBar, EmptyState, ScreenShell, SectionLabel, TextIcon } from '../../components/AcropolisUI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SessionAttendanceSummary } from '../../types';
import { getApiErrorMessage, handleSessionExpired } from '../../utils/apiErrors';
import { useAppTheme } from '../../styles/appTheme';

const formatDateToDdMmYyyy = (date: string) => {
  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return date;
  }
  return `${match[3]}-${match[2]}-${match[1]}`;
};

export const AttendanceListScreen = ({ navigation }: any) => {
  const { logout } = useAuth();
  const { showToast } = useToast();
  const theme = useAppTheme();
  const [sessionSummaries, setSessionSummaries] = useState<SessionAttendanceSummary[]>([]);
  const [dateSearch, setDateSearch] = useState('');
  const [subjectSearch, setSubjectSearch] = useState('');

  const fetchSessions = useCallback(async () => {
    const { data } = await api.get<SessionAttendanceSummary[]>('/api/teacher/attendance/sessions');
    setSessionSummaries(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSessions().catch(async (e: any) => {
        if (await handleSessionExpired(e, logout, showToast)) return;
        showToast(getApiErrorMessage(e, 'Failed to load attendance list.'), { type: 'error' });
      });
    }, [fetchSessions, logout, showToast])
  );

  const sessions = useMemo(() => {
    return [...sessionSummaries]
      .sort((a, b) => {
        if (a.date !== b.date) {
          return b.date.localeCompare(a.date);
        }
        return (a.subject ?? '').localeCompare(b.subject ?? '');
      })
      .map((session) => {
        const date = session.date;
        const subject = session.subject?.trim() || 'N/A';
        const examYear = session.examYear?.trim() || 'N/A';
        const examSemester = session.examSemester?.trim() || 'N/A';
        const examBranch = session.examBranch?.trim() || 'N/A';
        const examSection = session.examSection?.trim() || 'N/A';
        const context = `Y${examYear} S${examSemester} | ${examBranch} | Sec ${examSection}`;
        return {
          sessionId: session.sessionId,
          title: `Date: ${formatDateToDdMmYyyy(date)} | Subject: ${subject} | ${context}`,
          date,
          displayDate: formatDateToDdMmYyyy(date),
          subject,
          examYear: session.examYear ?? '',
          examSemester: session.examSemester ?? '',
          examBranch: session.examBranch ?? '',
          examSection: session.examSection ?? '',
          presentCount: session.presentCount,
          absentCount: session.absentCount,
          totalCount: session.totalCount,
          rosterResolved: session.rosterResolved
        };
      });
  }, [sessionSummaries]);

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

  const clearFilters = () => {
    setDateSearch('');
    setSubjectSearch('');
  };

  const hasFilters = dateSearch.trim().length > 0 || subjectSearch.trim().length > 0;

  return (
    <ScreenShell>
      <AcropolisBackBar title="Attendance History" subtitle="Session Attendance" onBack={() => navigation.goBack()} />
      <FlatList
        data={filteredSessions}
        keyExtractor={(item, index) => item.sessionId != null ? `session:${item.sessionId}` : `${item.date}::${item.subject}::${index}`}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <View style={[styles.filterCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
              <Text style={[styles.filterTitle, { color: theme.ink }]}>Find attendance sessions</Text>
              <TextInput
                label="Search by Date (DD-MM-YYYY)"
                mode="outlined"
                value={dateSearch}
                onChangeText={setDateSearch}
                style={[styles.input, { backgroundColor: theme.card }]}
                textColor={theme.ink}
                outlineColor={theme.border}
                activeOutlineColor={theme.blue}
              />
              <TextInput
                label="Search by Subject"
                mode="outlined"
                value={subjectSearch}
                onChangeText={setSubjectSearch}
                style={[styles.input, { backgroundColor: theme.card }]}
                textColor={theme.ink}
                outlineColor={theme.border}
                activeOutlineColor={theme.blue}
              />
              <Pressable onPress={clearFilters} disabled={!hasFilters} style={[styles.clearButton, { borderColor: theme.rose }, !hasFilters && { borderColor: theme.border }]}>
                <Text style={[styles.clearText, { color: theme.rose }, !hasFilters && { color: theme.ghost }]}>Clear Filters</Text>
              </Pressable>
            </View>
            <SectionLabel title={hasFilters ? `${filteredSessions.length} sessions found` : `${sessions.length} sessions`} />
          </>
        }
        ListEmptyComponent={<EmptyState title="No attendance entries found" subtitle="Try changing the date or subject filter." />}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.sessionCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }, pressed && styles.pressed]}
            onPress={() =>
              navigation.navigate('AttendanceSessionDetails', {
                title: item.title,
                sessionId: item.sessionId,
                date: item.date,
                subject: item.subject,
                examYear: item.examYear,
                examSemester: item.examSemester,
                examBranch: item.examBranch,
                examSection: item.examSection,
                records: []
              })
            }
          >
            <TextIcon label="BK" tone="gold" />
            <View style={styles.sessionCopy}>
              <Text style={[styles.sessionSubject, { color: theme.ink }]} numberOfLines={1}>{item.subject}</Text>
              <Text style={[styles.sessionMeta, { color: theme.muted }]}>{item.displayDate}</Text>
            </View>
            <View style={[styles.countBadge, { backgroundColor: theme.greenSoft }]}>
              <Text style={[styles.countText, { color: theme.green }]}>{item.presentCount}/{item.totalCount}</Text>
            </View>
            <Text style={[styles.chevron, { color: theme.blue }]}>{'>'}</Text>
          </Pressable>
        )}
      />
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  listContent: { padding: 18, paddingBottom: 28 },
  filterCard: { backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: ACR.border, padding: 14, shadowColor: '#1C1917', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  filterTitle: { color: ACR.ink, fontSize: 16, fontWeight: '900', marginBottom: 10 },
  input: { marginBottom: 10, backgroundColor: '#FFFFFF' },
  clearButton: { alignSelf: 'flex-start', borderRadius: 999, borderWidth: 1, borderColor: ACR.rose, paddingHorizontal: 14, paddingVertical: 9 },
  clearButtonDisabled: { borderColor: ACR.border },
  clearText: { color: ACR.rose, fontSize: 12, fontWeight: '900' },
  clearTextDisabled: { color: ACR.ghost },
  sessionCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: ACR.border, borderRadius: 18, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#1C1917', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
  sessionCopy: { flex: 1 },
  sessionSubject: { color: ACR.ink, fontSize: 15, fontWeight: '900' },
  sessionMeta: { color: ACR.muted, fontSize: 12, fontWeight: '700', marginTop: 3 },
  countBadge: { minWidth: 42, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, backgroundColor: '#ECFDF5', alignItems: 'center' },
  countText: { color: ACR.green, fontWeight: '900' },
  chevron: { color: ACR.blue, fontSize: 22, fontWeight: '900' },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.9 }
});
