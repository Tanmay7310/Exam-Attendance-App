import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AcropolisBackBar, HeroCard, ModuleCard, ScreenShell, SectionLabel } from '../../components/AcropolisUI';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { TeacherItem } from '../../types';
import { getApiErrorMessage, handleSessionExpired } from '../../utils/apiErrors';

export const TeacherControlsScreen = ({ navigation }: any) => {
  const { logout } = useAuth();
  const { showToast } = useToast();
  const [teacherCount, setTeacherCount] = useState<number | null>(null);

  const refreshTeacherCount = useCallback(async () => {
    const { data } = await api.get<TeacherItem[]>('/api/admin/teachers');
    setTeacherCount(Array.isArray(data) ? data.length : 0);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshTeacherCount().catch(async (e: any) => {
        if (await handleSessionExpired(e, logout, showToast)) return;
        setTeacherCount(null);
        showToast(getApiErrorMessage(e, 'Unable to load teacher count.'), { type: 'error' });
      });
    }, [logout, refreshTeacherCount, showToast])
  );

  const teacherCountLabel = teacherCount == null ? '--' : String(teacherCount);

  return (
    <ScreenShell>
      <AcropolisBackBar title="Teacher Controls" subtitle="Faculty management" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <HeroCard>
          <View style={styles.statsRow}>
            <Stat value={teacherCountLabel} label="Faculty" caption="Database records" />
            <View style={styles.divider} />
            <Stat value={teacherCountLabel} label="Accounts" caption="Teacher profiles" />
          </View>
        </HeroCard>

        <SectionLabel title="Actions" />
        <ModuleCard
          title="Teacher Management"
          subtitle="Add faculty accounts or import teacher data"
          iconKind="teacher"
          tone="blue"
          onPress={() => navigation.navigate('TeacherManagement')}
        />
        <ModuleCard
          title="Teachers"
          subtitle="Search, view, and remove faculty members"
          iconKind="users"
          tone="indigo"
          onPress={() => navigation.navigate('Teachers')}
        />
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

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 28 },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  divider: { width: 1, height: 54, backgroundColor: 'rgba(255,255,255,0.12)' },
  statBox: { flex: 1, alignItems: 'center' },
  statLabel: { color: '#BFD1FF', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2 },
  statValue: { color: '#FFFFFF', fontSize: 30, fontWeight: '900', marginTop: 3 },
  statCaption: { color: '#93C5FD', fontSize: 10, fontWeight: '700' }
});
