import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ACR, AcropolisHomeBar, HeroCard, IconMark, ScreenShell, SectionLabel } from '../../components/AcropolisUI';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AdminAttendance, StudentItem, SubjectItem, TeacherItem } from '../../types';
import { getApiErrorMessage, handleSessionExpired } from '../../utils/apiErrors';
import { useAppTheme } from '../../styles/appTheme';

type LandingStats = {
  teachers: number | null;
  sessions: number | null;
  departments: number | null;
};

const countSessions = (rows: AdminAttendance[]) => {
  const sessions = new Set<string>();
  rows.forEach((row) => {
    sessions.add(row.sessionId != null
      ? `session:${row.sessionId}`
      : `${row.date}|${row.subject}|${row.teacherCode}|${row.examYear ?? ''}|${row.examSemester ?? ''}|${row.examBranch ?? ''}|${row.examSection ?? ''}`);
  });
  return sessions.size;
};

const countDepartments = (students: StudentItem[], subjects: SubjectItem[]) => {
  const departments = new Set<string>();
  students.forEach((student) => {
    const value = student.department?.trim().toLowerCase();
    if (value) departments.add(value);
  });
  subjects.forEach((subject) => {
    const value = subject.branch?.trim().toLowerCase();
    if (value) departments.add(value);
  });
  return departments.size;
};

const formatCount = (value: number | null) => value == null ? '--' : String(value);

export const AdminLandingScreen = ({ navigation }: any) => {
  const { auth, logout } = useAuth();
  const { showToast } = useToast();
  const theme = useAppTheme();
  const adminName = auth?.username ?? 'Admin User';
  const [stats, setStats] = useState<LandingStats>({ teachers: null, sessions: null, departments: null });

  const refreshStats = useCallback(async () => {
    try {
      const [teachersRes, studentsRes, attendanceRes, subjectsRes] = await Promise.all([
        api.get<TeacherItem[]>('/api/admin/teachers'),
        api.get<StudentItem[]>('/api/admin/students'),
        api.get<AdminAttendance[]>('/api/admin/attendance'),
        api.get<SubjectItem[]>('/api/admin/subjects')
      ]);

      const teachers = Array.isArray(teachersRes.data) ? teachersRes.data : [];
      const students = Array.isArray(studentsRes.data) ? studentsRes.data : [];
      const attendanceRows = Array.isArray(attendanceRes.data) ? attendanceRes.data : [];
      const subjects = Array.isArray(subjectsRes.data) ? subjectsRes.data : [];

      setStats({
        teachers: teachers.length,
        sessions: countSessions(attendanceRows),
        departments: countDepartments(students, subjects)
      });
    } catch (e: any) {
      if (await handleSessionExpired(e, logout, showToast)) return;
      showToast(getApiErrorMessage(e, 'Unable to refresh admin summary.'), { type: 'error' });
    }
  }, [logout, showToast]);

  useFocusEffect(
    useCallback(() => {
      refreshStats().catch(() => undefined);
    }, [refreshStats])
  );

  return (
    <ScreenShell>
      <AcropolisHomeBar title="Admin Portal" subtitle="AITR System" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <HeroCard>
          <View style={styles.identityRow}>
            <IconMark kind="settings" tone="amber" size={52} />
            <View style={styles.identityCopy}>
              <Text style={styles.heroKicker}>System Administrator</Text>
              <Text style={styles.heroName}>{adminName}</Text>
              <Text style={styles.heroMeta}>Admin access</Text>
            </View>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.statsStrip}>
            <Stat value={formatCount(stats.sessions)} label="Recorded" caption="Sessions" />
            <View style={styles.statDivider} />
            <Stat value={formatCount(stats.teachers)} label="Faculty" caption="Teachers" />
            <View style={styles.statDivider} />
            <Stat value={formatCount(stats.departments)} label="Departments" caption="Configured" />
          </View>
        </HeroCard>

        <SectionLabel title="Core Functions" />
        <View style={styles.coreGrid}>
          <AdminTile
            title="Scan Attendance"
            subtitle="Mark session attendance"
            iconKind="scan"
            tone="blue"
            onPress={() => navigation.navigate('EnterExamDetails', { returnTo: 'AdminLanding' })}
          />
          <AdminTile
            title="Admin Controls"
            subtitle="Manage system modules"
            iconKind="settings"
            tone="indigo"
            onPress={() => navigation.navigate('AdminDashboard')}
          />
        </View>

        <SectionLabel title="Monitoring" />
        <AdminRow
          title="View Attendance"
          subtitle="Session attendance history"
          iconKind="file"
          tone="indigo"
          onPress={() => navigation.navigate('AttendanceList')}
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

const Stat = ({ value, label, caption }: { value: string; label: string; caption: string }) => (
  <View style={styles.statBox}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statCaption}>{caption}</Text>
  </View>
);

const AdminTile = ({ title, subtitle, iconKind, tone, onPress }: any) => {
  const theme = useAppTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.tile, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }, pressed && styles.pressed]}>
      <IconMark kind={iconKind} tone={tone} size={48} />
      <Text style={[styles.tileTitle, { color: theme.ink }]}>{title}</Text>
      <Text style={[styles.tileSubtitle, { color: theme.muted }]}>{subtitle}</Text>
      <Text style={[styles.tileArrow, { color: theme.ghost }]}>{'>'}</Text>
    </Pressable>
  );
};

const AdminRow = ({ title, subtitle, iconKind, tone, onPress }: any) => {
  const theme = useAppTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.rowCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }, pressed && styles.pressed]}>
      <IconMark kind={iconKind} tone={tone} size={48} />
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, { color: theme.ink }]}>{title}</Text>
        <Text style={[styles.rowSubtitle, { color: theme.muted }]}>{subtitle}</Text>
      </View>
      <Text style={[styles.rowArrow, { color: theme.ghost }]}>{'>'}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 28 },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  identityCopy: { flex: 1 },
  heroKicker: { color: ACR.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.4, textTransform: 'uppercase' },
  heroName: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', marginTop: 5 },
  heroMeta: { color: '#BFD1FF', fontSize: 12, fontWeight: '700', marginTop: 2 },
  heroDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: 16 },
  statsStrip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  statBox: { flex: 1, alignItems: 'center' },
  statLabel: { color: '#BFD1FF', fontSize: 9, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' },
  statValue: { color: '#FFFFFF', fontSize: 28, fontWeight: '900', marginTop: 3 },
  statCaption: { color: '#93C5FD', fontSize: 10, fontWeight: '700' },
  statDivider: { width: 1, height: 48, backgroundColor: 'rgba(255,255,255,0.12)' },
  coreGrid: { flexDirection: 'row', gap: 12 },
  tile: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: ACR.border, borderRadius: 22, padding: 14, minHeight: 165, shadowColor: '#1C1917', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  tileTitle: { color: ACR.ink, fontSize: 15, fontWeight: '900', marginTop: 13 },
  tileSubtitle: { color: ACR.muted, fontSize: 11, lineHeight: 16, marginTop: 4 },
  tileArrow: { color: '#D1D5DB', fontSize: 22, fontWeight: '900', alignSelf: 'flex-end', marginTop: 'auto' },
  rowCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: ACR.border, borderRadius: 20, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 12, shadowColor: '#1C1917', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
  rowCopy: { flex: 1 },
  rowTitle: { color: ACR.ink, fontSize: 15, fontWeight: '900' },
  rowSubtitle: { color: ACR.muted, fontSize: 12, marginTop: 3 },
  rowArrow: { color: '#D1D5DB', fontSize: 24, fontWeight: '900' },
  signOutRow: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: ACR.border, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  signOutTitle: { color: ACR.rose, fontSize: 15, fontWeight: '900' },
  signOutSubtitle: { color: ACR.muted, fontSize: 12, marginTop: 3 },
  signOutArrow: { color: ACR.rose, fontSize: 22, fontWeight: '900' },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.9 }
});
