import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Button, Surface, Text, TextInput } from 'react-native-paper';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { StudentItem } from '../../types';
import { colors } from '../../styles/theme';

export const StudentsScreen = () => {
  const { logout } = useAuth();
  const { showToast } = useToast();
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [enrollmentSearch, setEnrollmentSearch] = useState('');
  const [diagnostics, setDiagnostics] = useState('');

  const loadStudents = useCallback(async () => {
    const { data } = await api.get<StudentItem[]>('/api/admin/students');
    setStudents(data);
    setDiagnostics('');
  }, []);

  React.useEffect(() => {
    loadStudents().catch(async (e: any) => {
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        showToast('Session expired. Please login again.', { type: 'error' });
        await logout();
        return;
      }
      setDiagnostics(`Load students failed (${status ?? 'network'}): ${e?.message ?? 'Unknown error'}`);
      showToast(e?.response?.data?.message ?? e?.message ?? 'Failed to load students', { type: 'error' });
    });
  }, [loadStudents, logout, showToast]);

  const removeStudent = async (id: number) => {
    try {
      await api.delete(`/api/admin/students/${id}`);
      await loadStudents();
      showToast('Student removed.', { type: 'success' });
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        showToast('Session expired. Please login again.', { type: 'error' });
        await logout();
        return;
      }
      showToast(e?.response?.data?.message ?? e?.message ?? 'Unable to remove student', { type: 'error' });
    }
  };

  const filteredStudents = useMemo(() => {
    const search = enrollmentSearch.trim().toLowerCase();

    return [...students]
      .filter((student) => {
        if (!search) return true;
        return student.enrollmentNumber.toLowerCase().includes(search);
      })
      .sort((a, b) => a.enrollmentNumber.localeCompare(b.enrollmentNumber));
  }, [enrollmentSearch, students]);

  return (
    <View style={styles.container}>
      {diagnostics ? <Text style={styles.debugError}>{diagnostics}</Text> : null}
      <TextInput
        label="Search by Enrollment Number"
        mode="outlined"
        style={styles.input}
        value={enrollmentSearch}
        onChangeText={setEnrollmentSearch}
      />

      <FlatList
        data={filteredStudents}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={<Text style={styles.empty}>No students found.</Text>}
        renderItem={({ item }) => (
          <Surface style={styles.card} elevation={1}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>Enrollment: {item.enrollmentNumber}</Text>
            <Text style={styles.meta}>Scholar: {item.scholarNumber}</Text>
            <Text style={styles.meta}>{item.department} | Section {item.section}</Text>
            <Button mode="outlined" textColor={colors.danger} style={styles.remove} onPress={() => removeStudent(item.id)}>
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
  name: { fontWeight: '700', color: colors.text },
  meta: { color: colors.textMuted, marginTop: 2 },
  remove: {
    marginTop: 8,
    alignSelf: 'flex-start'
  },
  empty: { marginTop: 18, textAlign: 'center', color: colors.textMuted },
  debugError: { color: colors.danger, marginBottom: 6, fontSize: 12 }
});
