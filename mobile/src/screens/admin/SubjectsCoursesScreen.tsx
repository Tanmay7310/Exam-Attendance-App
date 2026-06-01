import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../api/client';
import { ACR, AcropolisBackBar, ScreenShell, SectionLabel } from '../../components/AcropolisUI';
import { AdminEmpty, AdminListCard, AdminSearchInput } from '../../components/AdminModuleUI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SubjectItem } from '../../types';
import { getApiErrorMessage, handleSessionExpired } from '../../utils/apiErrors';

export const SubjectsCoursesScreen = ({ navigation }: any) => {
  const { logout } = useAuth();
  const { showToast } = useToast();
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loadingFailed, setLoadingFailed] = useState(false);
  const [search, setSearch] = useState('');

  const loadSubjects = useCallback(async () => {
    const { data } = await api.get<SubjectItem[]>('/api/admin/subjects');
    setSubjects(data);
    setLoadingFailed(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSubjects().catch(async (e: any) => {
        if (await handleSessionExpired(e, logout, showToast)) return;
        setLoadingFailed(true);
        showToast(getApiErrorMessage(e, 'Unable to load subjects.'), { type: 'error' });
      });
    }, [loadSubjects, logout, showToast])
  );

  const courses = useMemo(() => {
    const grouped = new Map<string, SubjectItem[]>();
    subjects.forEach((item) => {
      const key = item.branch.trim();
      if (!key) return;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)?.push(item);
    });

    const q = search.trim().toLowerCase();
    return Array.from(grouped.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([branch, rows]) => ({ branch, count: rows.length, semesters: new Set(rows.map((row) => row.semester)).size }))
      .filter((item) => !q || item.branch.toLowerCase().includes(q));
  }, [subjects, search]);

  return (
    <ScreenShell>
      <AcropolisBackBar title="Subjects & Courses" subtitle="Courses" onBack={() => navigation.goBack()} />
      <FlatList
        data={courses}
        keyExtractor={(item) => item.branch}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <AdminSearchInput value={search} onChangeText={setSearch} placeholder="Search course or branch" />
            <SectionLabel title={search.trim() ? `Results (${courses.length})` : `All Courses (${courses.length})`} />
          </>
        }
        ListEmptyComponent={<AdminEmpty title={loadingFailed ? 'Unable to load subjects' : 'No subjects added yet'} subtitle={loadingFailed ? 'Try opening this screen again.' : 'Add subjects to create course groups.'} />}
        renderItem={({ item }) => (
          <AdminListCard
            iconKind="book"
            tone="amber"
            title={item.branch}
            meta={`${item.semesters} semester${item.semesters === 1 ? '' : 's'} | ${item.count} subject${item.count === 1 ? '' : 's'}`}
            onPress={() => navigation.navigate('SubjectsSemesters', { branch: item.branch })}
          />
        )}
      />
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 28 }
});
