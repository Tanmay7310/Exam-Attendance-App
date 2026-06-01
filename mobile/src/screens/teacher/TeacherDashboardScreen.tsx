import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { ACR, AcropolisHomeBar, FileTextMark, HeroCard, QrCodeMark, ScreenShell, SectionLabel, TextIcon } from '../../components/AcropolisUI';

export const TeacherDashboardScreen = ({ navigation }: any) => {
  const { auth, logout } = useAuth();
  const teacherName = auth?.teacherName ?? auth?.username ?? 'Faculty';
  const teacherCode = auth?.teacherCode ?? 'N/A';
  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <ScreenShell>
      <AcropolisHomeBar title="AITR Attendance" subtitle="Faculty Portal" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <HeroCard>
          <View style={styles.heroTopRow}>
            <TextIcon label="ID" tone="gold" />
            <View style={styles.heroCopy}>
              <Text style={styles.heroKicker}>Faculty Session</Text>
              <Text style={styles.heroName}>{teacherName}</Text>
              <Text style={styles.heroMeta}>{teacherCode}</Text>
            </View>
          </View>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Ready for exam attendance</Text>
          </View>
        </HeroCard>

        <View style={styles.dateStrip}>
          <Text style={styles.dateLabel}>Today</Text>
          <Text style={styles.dateValue}>{dateLabel}</Text>
        </View>

        <SectionLabel title="Quick Actions" />
        <View style={styles.actionList}>
          <DashboardActionRow
            title="Scan Student Code"
            icon={<QrCodeMark />}
            onPress={() => navigation.navigate('EnterExamDetails', { returnTo: 'TeacherDashboard' })}
          />
          <DashboardActionRow
            title="View Attendance"
            icon={<FileTextMark />}
            onPress={() => navigation.navigate('AttendanceList')}
          />
        </View>

        <SectionLabel title="Account" />
        <Pressable onPress={logout} style={({ pressed }) => [styles.logoutRow, pressed && styles.pressed]}>
          <View>
            <Text style={styles.logoutTitle}>Sign Out</Text>
            <Text style={styles.logoutSubtitle}>End the current authenticated session.</Text>
          </View>
          <Text style={styles.logoutArrow}>{'>'}</Text>
        </Pressable>
      </ScrollView>

      <Pressable onPress={() => navigation.navigate('EnterExamDetails', { returnTo: 'TeacherDashboard' })} style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}>
        <Text style={styles.fabText}>Enter Exam Details</Text>
      </Pressable>
    </ScreenShell>
  );
};

const DashboardActionRow = ({ title, icon, onPress }: { title: string; icon: React.ReactNode; onPress: () => void }) => (
  <Pressable onPress={onPress} style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}>
    {icon}
    <View style={styles.actionRowCopy}>
      <Text style={styles.actionRowTitle}>{title}</Text>
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 104 },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroCopy: { flex: 1 },
  heroKicker: { color: ACR.gold, fontSize: 11, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' },
  heroName: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', marginTop: 6 },
  heroMeta: { color: '#BFD1FF', fontSize: 12, fontWeight: '700', marginTop: 3 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.14)' },
  statusDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#22C55E', marginRight: 8 },
  statusText: { color: '#E0EAFF', fontSize: 12, fontWeight: '700' },
  dateStrip: { marginTop: 16, backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: ACR.border, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateLabel: { color: ACR.goldDeep, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.1 },
  dateValue: { color: ACR.ink, fontSize: 13, fontWeight: '800' },
  actionList: { gap: 14 },
  actionRow: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16, shadowColor: '#0F172A', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  actionRowPressed: { transform: [{ scale: 0.98 }], borderColor: '#93C5FD' },
  actionRowCopy: { flex: 1 },
  actionRowTitle: { color: '#0F172A', fontSize: 18, fontWeight: '800' },
  logoutRow: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: ACR.border, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logoutTitle: { color: ACR.rose, fontSize: 15, fontWeight: '900' },
  logoutSubtitle: { color: ACR.muted, fontSize: 12, marginTop: 3 },
  logoutArrow: { color: ACR.rose, fontSize: 22, fontWeight: '900' },
  pressed: { opacity: 0.85 },
  fab: { position: 'absolute', left: 18, right: 18, bottom: 22, minHeight: 58, borderRadius: 18, backgroundColor: ACR.blue, alignItems: 'center', justifyContent: 'center', shadowColor: ACR.blue, shadowOpacity: 0.28, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 5 },
  fabPressed: { transform: [{ scale: 0.98 }] },
  fabText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' }
});
