import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Surface, Text, TouchableRipple } from 'react-native-paper';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SubjectItem } from '../../types';
import { colors } from '../../styles/theme';

export const SubjectsCoursesScreen = ({ navigation }: any) => {
  const { logout } = useAuth();
  const { showToast } = useToast();
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loadingFailed, setLoadingFailed] = useState(false);

  const loadSubjects = useCallback(async () => {
    const { data } = await api.get<SubjectItem[]>('/api/admin/subjects');
    setSubjects(data);
    setLoadingFailed(false);
  }, []);

  React.useEffect(() => {
    loadSubjects().catch(async (e: any) => {
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        showToast('Session expired. Please login again.', { type: 'error' });
        await logout();
        return;
      }
      setLoadingFailed(true);
      showToast(e?.response?.data?.message ?? 'Unable to load subjects.', { type: 'error' });
    });
  }, [loadSubjects, logout, showToast]);

  const courses = useMemo(() => {
    const grouped = new Map<string, SubjectItem[]>();
    subjects.forEach((item) => {
      const key = item.branch.trim();
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)?.push(item);
    });

    return Array.from(grouped.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([branch, rows]) => ({
        branch,
        count: rows.length,
        rows
      }));
  }, [subjects]);

  return (
    <View style={styles.container}>
      <FlatList
        data={courses}
        keyExtractor={(item) => item.branch}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {loadingFailed ? 'Unable to load subjects right now. Please try again.' : 'No subjects added yet.'}
          </Text>
        }
        renderItem={({ item }) => (
          <Surface style={styles.card} elevation={1}>
            <TouchableRipple
              style={styles.press}
              onPress={() => navigation.navigate('SubjectsSemesters', { branch: item.branch, subjects: item.rows })}
            >
              <View>
                <Text style={styles.title}>{item.branch}</Text>
                <Text style={styles.meta}>{item.count} subject{item.count === 1 ? '' : 's'}</Text>
              </View>
            </TouchableRipple>
          </Surface>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: colors.bg },
  card: {
    backgroundColor: colors.card,
    borderRadius: 10,
    marginBottom: 8,
    overflow: 'hidden'
  },
  press: { padding: 12 },
  title: { color: colors.text, fontWeight: '700' },
  meta: { color: colors.textMuted, marginTop: 4 },
  empty: { marginTop: 18, textAlign: 'center', color: colors.textMuted }
});
