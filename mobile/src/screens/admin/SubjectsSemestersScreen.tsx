import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Surface, Text, TouchableRipple } from 'react-native-paper';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SubjectItem } from '../../types';
import { colors } from '../../styles/theme';

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

  React.useEffect(() => {
    const runLoad = () => {
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
    };

    runLoad();
    const unsubscribe = navigation.addListener('focus', runLoad);
    return unsubscribe;
  }, [loadSubjects, logout, navigation, showToast]);

  const semesters = useMemo(() => {
    const grouped = new Map<string, SubjectItem[]>();
    subjects.forEach((item) => {
      const key = item.semester.trim();
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)?.push(item);
    });

    return Array.from(grouped.entries())
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([semester, rows]) => ({
        semester,
        count: rows.length
      }));
  }, [subjects]);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{branch}</Text>
      <FlatList
        data={semesters}
        keyExtractor={(item) => item.semester}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {loadingFailed ? 'Unable to load semesters right now. Please try again.' : 'No semesters found for this course.'}
          </Text>
        }
        renderItem={({ item }) => (
          <Surface style={styles.card} elevation={1}>
            <TouchableRipple
              style={styles.press}
              onPress={() =>
                navigation.navigate('SubjectsList', {
                  branch,
                  semester: item.semester
                })
              }
            >
              <View>
                <Text style={styles.title}>Semester {item.semester}</Text>
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
  heading: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 },
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
