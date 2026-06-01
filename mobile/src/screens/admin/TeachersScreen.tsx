import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../api/client';
import { AcropolisBackBar, ScreenShell, SectionLabel } from '../../components/AcropolisUI';
import { AdminEmpty, AdminIconAction, AdminListCard, AdminSearchInput } from '../../components/AdminModuleUI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { TeacherItem } from '../../types';
import { getApiErrorMessage, handleSessionExpired } from '../../utils/apiErrors';
import { ACR } from '../../components/AcropolisUI';

export const TeachersScreen = ({ navigation }: any) => {
  const { logout } = useAuth();
  const { showToast } = useToast();
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [search, setSearch] = useState('');
  const [diagnostics, setDiagnostics] = useState('');

  const loadTeachers = useCallback(async () => {
    const { data } = await api.get<TeacherItem[]>('/api/admin/teachers');
    setTeachers(data);
    setDiagnostics('');
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTeachers().catch(async (e: any) => {
        if (await handleSessionExpired(e, logout, showToast)) return;
        setDiagnostics(`Load teachers failed (${e?.response?.status ?? 'network'}): ${e?.message ?? 'Unknown error'}`);
        showToast(getApiErrorMessage(e, 'Failed to load teachers'), { type: 'error' });
      });
    }, [loadTeachers, logout, showToast])
  );

  const removeTeacher = async (id: number) => {
    try {
      await api.delete(`/api/admin/teachers/${id}`);
      await loadTeachers();
      showToast('Teacher removed.', { type: 'success' });
    } catch (e: any) {
      if (await handleSessionExpired(e, logout, showToast)) return;
      showToast(getApiErrorMessage(e, 'Unable to remove teacher'), { type: 'error' });
    }
  };

  const normalizedSearch = search.trim().toLowerCase();
  const filteredTeachers = teachers.filter((teacher) => {
    if (!normalizedSearch) return true;
    return teacher.teacherCode.toLowerCase().includes(normalizedSearch) || teacher.name.toLowerCase().includes(normalizedSearch);
  });

  return (
    <ScreenShell>
      <AcropolisBackBar title="Teachers" subtitle={`${teachers.length} faculty records`} onBack={() => navigation.goBack()} />
      <FlatList
        data={filteredTeachers}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            {diagnostics ? <Text style={styles.debugError}>{diagnostics}</Text> : null}
            <AdminSearchInput value={search} onChangeText={setSearch} placeholder="Search by teacher code or name" />
            <SectionLabel title={search.trim() ? `Results (${filteredTeachers.length})` : `Teachers (${teachers.length})`} />
          </>
        }
        ListEmptyComponent={<AdminEmpty title="No teachers found" subtitle="Try a different teacher code or name." />}
        renderItem={({ item }) => (
          <AdminListCard
            iconKind="teacher"
            tone="indigo"
            title={item.name}
            meta={`${item.teacherCode} | ${item.username}`}
            caption={item.subject ? `Subject: ${item.subject}` : undefined}
            right={<AdminIconAction label="Remove" tone="rose" onPress={() => removeTeacher(item.id)} />}
          />
        )}
      />
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 28 },
  debugError: { color: ACR.rose, marginBottom: 8, fontSize: 12, fontWeight: '800' }
});
