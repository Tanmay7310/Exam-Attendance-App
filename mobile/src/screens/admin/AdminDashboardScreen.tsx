import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ACR, AcropolisBackBar, HeroCard, ModuleCard, ScreenShell, SectionLabel } from '../../components/AcropolisUI';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AdminAttendance, StudentItem, SubjectItem, TeacherItem } from '../../types';
import { getApiErrorMessage, handleSessionExpired } from '../../utils/apiErrors';
import { useAppTheme } from '../../styles/appTheme';

type DashboardStats = {
  teachers: number | null;
  students: number | null;
  sessions: number | null;
  subjects: number | null;
};

const initialStats: DashboardStats = {
  teachers: null,
  students: null,
  sessions: null,
  subjects: null
};

const formatCount = (value: number | null) => value == null ? '--' : String(value);

const countSessions = (rows: AdminAttendance[]) => {
  const sessions = new Set<string>();

  rows.forEach((row) => {
    const key = row.sessionId != null
      ? `session:${row.sessionId}`
      : `${row.date}|${row.subject}|${row.teacherCode}|${row.examYear ?? ''}|${row.examSemester ?? ''}|${row.examBranch ?? ''}|${row.examSection ?? ''}`;
    sessions.add(key);
  });

  return sessions.size;
};

export const AdminDashboardScreen = ({ navigation }: any) => {
  const { logout } = useAuth();
  const { showToast } = useToast();
  const theme = useAppTheme();
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [loadingStats, setLoadingStats] = useState(false);
  const [lastSyncLabel, setLastSyncLabel] = useState('Not synced yet');

  const refreshStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const [teachersRes, studentsRes, attendanceRes, subjectsRes] = await Promise.all([
        api.get<TeacherItem[]>('/api/admin/teachers'),
        api.get<StudentItem[]>('/api/admin/students'),
        api.get<AdminAttendance[]>('/api/admin/attendance'),
        api.get<SubjectItem[]>('/api/admin/subjects')
      ]);

      setStats({
        teachers: Array.isArray(teachersRes.data) ? teachersRes.data.length : 0,
        students: Array.isArray(studentsRes.data) ? studentsRes.data.length : 0,
        sessions: Array.isArray(attendanceRes.data) ? countSessions(attendanceRes.data) : 0,
        subjects: Array.isArray(subjectsRes.data) ? subjectsRes.data.length : 0
      });
      setLastSyncLabel(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (e: any) {
      if (await handleSessionExpired(e, logout, showToast)) return;
      showToast(getApiErrorMessage(e, 'Unable to refresh admin dashboard counts.'), { type: 'error' });
    } finally {
      setLoadingStats(false);
    }
  }, [logout, showToast]);

  useFocusEffect(
    useCallback(() => {
      refreshStats().catch(() => undefined);
    }, [refreshStats])
  );

  return (
    <ScreenShell>
      <AcropolisBackBar title="Admin Controls" subtitle="System Management Hub" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <HeroCard>
          <View style={styles.heroRow}>
            <View>
              <Text style={styles.heroKicker}>Backend Counts</Text>
              <Text style={styles.heroTitle}>{loadingStats ? 'Refreshing dashboard data' : 'Dashboard data synced'}</Text>
              <Text style={styles.heroMeta}>Last sync: {lastSyncLabel}</Text>
            </View>
            <Pressable onPress={refreshStats} disabled={loadingStats} style={[styles.refreshBadge, loadingStats && styles.refreshBadgeDisabled]}>
              <View style={styles.liveDot} />
              <Text style={styles.refreshText}>{loadingStats ? 'Loading' : 'Refresh'}</Text>
            </Pressable>
          </View>
        </HeroCard>

        <SectionLabel title="Management Modules" />
        <ModuleCard
          title="Teacher Controls"
          subtitle="Manage faculty accounts, import teachers, and view teacher records"
          iconKind="teacher"
          tone="indigo"
          stat={formatCount(stats.teachers)}
          statLabel="Teachers in database"
          onPress={() => navigation.navigate('TeacherControls')}
        />
        <ModuleCard
          title="Student Management"
          subtitle="Enrollments, batch promotions, scholar records"
          iconKind="users"
          tone="blue"
          stat={formatCount(stats.students)}
          statLabel="Students in database"
          onPress={() => navigation.navigate('StudentManagement')}
        />
        <ModuleCard
          title="Attendance Monitoring"
          subtitle="University-wide reports grouped by date and subject"
          iconKind="activity"
          tone="green"
          stat={formatCount(stats.sessions)}
          statLabel="Recorded sessions"
          onPress={() => navigation.navigate('AttendanceMonitoring')}
        />
        <ModuleCard
          title="Subjects & Courses"
          subtitle="Configure branches, semesters, and subject catalogues"
          iconKind="book"
          tone="amber"
          stat={formatCount(stats.subjects)}
          statLabel="Subjects in database"
          onPress={() => navigation.navigate('AddSubjects')}
        />

        <SectionLabel title="Account" />
        <Pressable onPress={logout} style={({ pressed }) => [styles.signOutRow, { backgroundColor: theme.card, borderColor: theme.border }, pressed && styles.pressed]}>
          <View>
            <Text style={[styles.signOutTitle, { color: theme.rose }]}>Sign Out</Text>
            <Text style={[styles.signOutSubtitle, { color: theme.muted }]}>End the current administrator session.</Text>
          </View>
          <Text style={[styles.signOutArrow, { color: theme.rose }]}>{'>'}</Text>
        </Pressable>
      </ScrollView>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 28 },
  heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  heroKicker: { color: '#BFD1FF', fontSize: 10, fontWeight: '900', letterSpacing: 1.3, textTransform: 'uppercase' },
  heroTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '900', marginTop: 4 },
  heroMeta: { color: '#BFD1FF', fontSize: 11, fontWeight: '700', marginTop: 4 },
  refreshBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(37,99,235,0.22)', borderWidth: 1, borderColor: 'rgba(191,209,255,0.35)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  refreshBadgeDisabled: { opacity: 0.7 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#6EE7B7' },
  refreshText: { color: '#DCE7FF', fontSize: 11, fontWeight: '900' },
  signOutRow: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: ACR.border, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  signOutTitle: { color: ACR.rose, fontSize: 15, fontWeight: '900' },
  signOutSubtitle: { color: ACR.muted, fontSize: 12, marginTop: 3 },
  signOutArrow: { color: ACR.rose, fontSize: 22, fontWeight: '900' },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.9 }
});
