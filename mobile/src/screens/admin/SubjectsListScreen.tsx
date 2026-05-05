import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { SubjectItem } from '../../types';
import { colors } from '../../styles/theme';

export const SubjectsListScreen = ({ route }: any) => {
  const branch: string = route?.params?.branch ?? '';
  const semester: string = route?.params?.semester ?? '';
  const subjects: SubjectItem[] = Array.isArray(route?.params?.subjects) ? route.params.subjects : [];

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{branch} - Semester {semester}</Text>
      <FlatList
        data={subjects}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={<Text style={styles.empty}>No subjects found.</Text>}
        renderItem={({ item }) => (
          <Surface style={styles.card} elevation={1}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>Code: {item.subjectCode}</Text>
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
    padding: 12
  },
  name: { color: colors.text, fontWeight: '700' },
  meta: { color: colors.textMuted, marginTop: 4 },
  empty: { marginTop: 18, textAlign: 'center', color: colors.textMuted }
});

