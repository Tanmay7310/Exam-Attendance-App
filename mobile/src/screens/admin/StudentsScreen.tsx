import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text } from 'react-native';
import { ACR, AcropolisBackBar, ScreenShell, SectionLabel } from '../../components/AcropolisUI';
import { AdminEmpty, AdminListCard } from '../../components/AdminModuleUI';
import { buildYearGroups, StudentGroup, UNASSIGNED_KEY } from './studentBrowseUtils';
import { useAdminStudents } from './useAdminStudents';

export const StudentsScreen = ({ navigation }: any) => {
  const { students, diagnostics } = useAdminStudents();
  const yearGroups = useMemo(() => buildYearGroups(students), [students]);

  const openYear = (item: StudentGroup) => {
    navigation.navigate('StudentSemesters', {
      yearKey: item.key,
      yearLabel: item.label
    });
  };

  return (
    <ScreenShell>
      <AcropolisBackBar title="Students" subtitle={`${students.length} enrolled records`} onBack={() => navigation.goBack()} />
      <FlatList
        data={yearGroups}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            {diagnostics ? <Text style={styles.debugError}>{diagnostics}</Text> : null}
            <SectionLabel title="Academic Years" />
          </>
        }
        ListEmptyComponent={<AdminEmpty title="No students found" subtitle="Add students to create year groups." />}
        renderItem={({ item }) => (
          <AdminListCard
            iconKind="student"
            tone={item.key === UNASSIGNED_KEY ? 'amber' : 'blue'}
            title={item.label}
            meta={`${item.count} student${item.count === 1 ? '' : 's'}`}
            caption="Browse semesters"
            onPress={() => openYear(item)}
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
