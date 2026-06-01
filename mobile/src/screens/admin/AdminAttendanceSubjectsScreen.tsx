import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../api/client';
import { ACR, AcropolisBackBar, EmptyState, HeroCard, IconMark, ScreenShell, SectionLabel } from '../../components/AcropolisUI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SessionAttendanceSummary } from '../../types';
import { getApiErrorMessage, handleSessionExpired } from '../../utils/apiErrors';

export const AdminAttendanceSubjectsScreen = ({ route, navigation }: any) => {
  const { logout } = useAuth();
  const { showToast } = useToast();
  const date: string = route?.params?.date ?? '';
  const teacherId: string = route?.params?.teacherId ?? '';
  const subjectFilter: string = route?.params?.subjectFilter ?? '';
  const initialSessions: SessionAttendanceSummary[] = Array.isArray(route?.params?.sessions) ? route.params.sessions : [];
  const [sessionSummaries, setSessionSummaries] = useState<SessionAttendanceSummary[]>(initialSessions);

  const fetchSessions = useCallback(async () => {
    if (!date) return;
    const params: any = { date };
    if (teacherId) params.teacherId = teacherId.trim();
    if (subjectFilter) params.subject = subjectFilter;
    const { data } = await api.get<SessionAttendanceSummary[]>('/api/admin/attendance/sessions', { params });
    setSessionSummaries(data);
  }, [date, teacherId, subjectFilter]);

  useFocusEffect(
    useCallback(() => {
      fetchSessions().catch(async (e: any) => {
        if (await handleSessionExpired(e, logout, showToast)) return;
        showToast(getApiErrorMessage(e, 'Failed to refresh sessions.'), { type: 'error' });
      });
    }, [fetchSessions, logout, showToast])
  );

  const subjects = useMemo(() => {
    return [...sessionSummaries]
      .sort((a, b) => (a.subject ?? '').localeCompare(b.subject ?? ''))
      .map((summary) => ({
        sessionId: summary.sessionId,
        subject: summary.subject?.trim() || 'N/A',
        title: `Subject: ${summary.subject?.trim() || 'N/A'}`,
        meta: `Teacher: ${summary.teacherName ?? 'N/A'} [${summary.teacherCode ?? 'N/A'}]`,
        presentCount: summary.presentCount,
        absentCount: summary.absentCount,
        totalCount: summary.totalCount,
        examYear: summary.examYear ?? '',
        examSemester: summary.examSemester ?? '',
        examBranch: summary.examBranch ?? '',
        examSection: summary.examSection ?? '',
        rosterResolved: summary.rosterResolved
      }));
  }, [sessionSummaries]);

  const presentCount = subjects.reduce((sum, item) => sum + item.presentCount, 0);
  const totalCount = subjects.reduce((sum, item) => sum + item.totalCount, 0);

  return (
    <ScreenShell>
      <AcropolisBackBar title={date || 'Attendance'} subtitle="Sessions this day" onBack={() => navigation.goBack()} />
      <FlatList
        data={subjects}
        keyExtractor={(item, index) => item.sessionId != null ? `session:${item.sessionId}` : `${item.subject}:${index}`}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <HeroCard>
              <View style={styles.heroRow}>
                <View>
                  <Text style={styles.heroKicker}>Selected Date</Text>
                  <Text style={styles.heroTitle}>{date || 'N/A'}</Text>
                  <Text style={styles.heroMeta}>Tap a subject to view student records</Text>
                </View>
                <View style={styles.recordsBox}>
                  <Text style={styles.recordsValue}>{presentCount}/{totalCount}</Text>
                  <Text style={styles.recordsLabel}>Present</Text>
                </View>
              </View>
            </HeroCard>
            <SectionLabel title="Subjects" />
          </>
        }
        ListEmptyComponent={<EmptyState title="No attendance records found" />}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.subjectCard, pressed && styles.pressed]}
            onPress={() =>
              navigation.navigate('AdminAttendanceDetails', {
                title: `Date: ${date} | Subject: ${item.subject}`,
                date,
                subject: item.subject,
                sessionId: item.sessionId,
                examYear: item.examYear,
                examSemester: item.examSemester,
                examBranch: item.examBranch,
                examSection: item.examSection,
                records: []
              })
            }
          >
            <IconMark kind="book" tone="indigo" size={48} />
            <View style={styles.subjectCopy}>
              <Text style={styles.subjectTitle}>{item.title}</Text>
              <Text style={styles.subjectMeta}>{item.meta}</Text>
              <Text style={styles.subjectMeta}>{item.presentCount}/{item.totalCount} present</Text>
            </View>
            <Text style={styles.chevron}>{'>'}</Text>
          </Pressable>
        )}
      />
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 28 },
  heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 },
  heroKicker: { color: ACR.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' },
  heroTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', marginTop: 5 },
  heroMeta: { color: '#BFD1FF', fontSize: 12, fontWeight: '700', marginTop: 5 },
  recordsBox: { alignItems: 'flex-end' },
  recordsValue: { color: '#FFFFFF', fontSize: 30, fontWeight: '900' },
  recordsLabel: { color: '#BFD1FF', fontSize: 10, fontWeight: '800' },
  subjectCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: ACR.border, borderRadius: 20, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 11, shadowColor: '#1C1917', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
  subjectCopy: { flex: 1 },
  subjectTitle: { color: ACR.ink, fontSize: 15, fontWeight: '900' },
  subjectMeta: { color: ACR.muted, fontSize: 12, marginTop: 3 },
  chevron: { color: '#D1D5DB', fontSize: 24, fontWeight: '900' },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.9 }
});
