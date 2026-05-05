import React, { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Surface, Text, TouchableRipple } from 'react-native-paper';
import { SubjectItem } from '../../types';
import { colors } from '../../styles/theme';

export const SubjectsSemestersScreen = ({ route, navigation }: any) => {
  const branch: string = route?.params?.branch ?? '';
  const subjects: SubjectItem[] = Array.isArray(route?.params?.subjects) ? route.params.subjects : [];

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
        count: rows.length,
        rows: rows.sort((x, y) => x.name.localeCompare(y.name))
      }));
  }, [subjects]);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{branch}</Text>
      <FlatList
        data={semesters}
        keyExtractor={(item) => item.semester}
        ListEmptyComponent={<Text style={styles.empty}>No semesters found for this course.</Text>}
        renderItem={({ item }) => (
          <Surface style={styles.card} elevation={1}>
            <TouchableRipple
              style={styles.press}
              onPress={() =>
                navigation.navigate('SubjectsList', {
                  branch,
                  semester: item.semester,
                  subjects: item.rows
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

