import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Button, Surface, Text, TextInput } from 'react-native-paper';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { TeacherItem } from '../../types';
import { colors } from '../../styles/theme';

export const TeachersScreen = () => {
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

  React.useEffect(() => {
    loadTeachers().catch(async (e: any) => {
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        showToast('Session expired. Please login again.', { type: 'error' });
        await logout();
        return;
      }
      setDiagnostics(`Load teachers failed (${status ?? 'network'}): ${e?.message ?? 'Unknown error'}`);
      showToast(e?.response?.data?.message ?? e?.message ?? 'Failed to load teachers', { type: 'error' });
    });
  }, [loadTeachers, logout, showToast]);

  const removeTeacher = async (id: number) => {
    try {
      await api.delete(`/api/admin/teachers/${id}`);
      await loadTeachers();
      showToast('Teacher removed.', { type: 'success' });
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        showToast('Session expired. Please login again.', { type: 'error' });
        await logout();
        return;
      }
      showToast(e?.response?.data?.message ?? e?.message ?? 'Unable to remove teacher', { type: 'error' });
    }
  };

  const normalizedSearch = search.trim().toLowerCase();
  const filteredTeachers = teachers.filter((teacher) => {
    if (!normalizedSearch) {
      return true;
    }

    return (
      teacher.teacherCode.toLowerCase().includes(normalizedSearch) ||
      teacher.name.toLowerCase().includes(normalizedSearch)
    );
  });

  return (
    <View style={styles.container}>
      <TextInput
        label="Search by Teacher Code or Name"
        mode="outlined"
        style={styles.input}
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={filteredTeachers}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={<Text style={styles.empty}>No teachers found.</Text>}
        renderItem={({ item }) => (
          <Surface style={styles.card} elevation={1}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>{item.teacherCode} | {item.username}</Text>
            <Button mode="outlined" textColor={colors.danger} style={styles.remove} onPress={() => removeTeacher(item.id)}>
              Remove
            </Button>
          </Surface>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: colors.bg },
  input: {
    marginBottom: 10
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8
  },
  name: { fontWeight: '700' },
  meta: { color: colors.textMuted, marginTop: 2 },
  remove: {
    marginTop: 8,
    alignSelf: 'flex-start'
  },
  empty: { marginTop: 18, textAlign: 'center', color: colors.textMuted }
});
