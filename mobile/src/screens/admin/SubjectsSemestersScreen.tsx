import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../api/client';
import { ACR, AcropolisBackBar, HeroCard, ScreenShell, SectionLabel } from '../../components/AcropolisUI';
import { AdminEmpty, AdminListCard, AdminStatTile } from '../../components/AdminModuleUI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SubjectItem } from '../../types';
import { getApiErrorMessage, handleSessionExpired } from '../../utils/apiErrors';

export const SubjectsSemestersScreen = ({ route, navigation }: any) => {
  const { logout } = useAuth();
  const { showToast } = useToast();
  const branch: string = route?.params?.branch ?? '';
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loadingFailed, setLoadingFailed] = useState(false);

  const loadSubjects = useCallback(async () => {
    const { data } = await api.get<SubjectItem[]>('/api/admin/subjects');
    const filtered = data.filter((item) => item.branch.trim().toLowerCase() === branch.trim().toLowerCase());
    setSubjects(filtered);
    setLoadingFailed(false);
  }, [branch]);

  useFocusEffect(
    useCallback(() => {
      loadSubjects().catch(async (e: any) => {
        if (await handleSessionExpired(e, logout, showToast)) return;
        setLoadingFailed(true);
        showToast(getApiErrorMessage(e, 'Unable to load subjects.'), { type: 'error' });
      });
    }, [loadSubjects, logout, showToast])
  );

  const semesters = useMemo(() => {
    const grouped = new Map<string, SubjectItem[]>();
    subjects.forEach((item) => {
      const key = item.semester.trim();
      if (!key) return;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)?.push(item);
    });

    return Array.from(grouped.entries())
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([semester, rows]) => ({ semester, count: rows.length }));
  }, [subjects]);

  return (
    <ScreenShell>
      <AcropolisBackBar title={branch || 'Course'} subtitle="Semesters" onBack={() => navigation.goBack()} />
      <FlatList
        data={semesters}
        keyExtractor={(item) => item.semester}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <HeroCard>
              <Text style={styles.heroKicker}>Course</Text>
              <Text style={styles.heroTitle}>{branch || 'N/A'}</Text>
              <Text style={styles.heroMeta}>Browse configured semesters and mapped subjects</Text>
            </HeroCard>
            <View style={styles.statsRow}>
              <AdminStatTile label="Semesters" value={semesters.length} tone="blue" />
              <AdminStatTile label="Subjects" value={subjects.length} tone="amber" />
            </View>
            <SectionLabel title="Semesters" />
          </>
        }
        ListEmptyComponent={<AdminEmpty title={loadingFailed ? 'Unable to load semesters' : 'No semesters found'} subtitle={loadingFailed ? 'Try opening this screen again.' : 'This course has no assigned subjects yet.'} />}
        renderItem={({ item }) => (
          <AdminListCard
            iconKind="book"
            tone="blue"
            title={`Semester ${item.semester}`}
            meta={`${item.count} subject${item.count === 1 ? '' : 's'}`}
            onPress={() => navigation.navigate('SubjectsList', { branch, semester: item.semester })}
          />
        )}
      />
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 28 },
  heroKicker: { color: ACR.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' },
  heroTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', marginTop: 5 },
  heroMeta: { color: '#BFD1FF', fontSize: 12, fontWeight: '700', marginTop: 5 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 14 }
});
