import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text } from 'react-native';
import { ACR, AcropolisBackBar, ScreenShell, SectionLabel } from '../../components/AcropolisUI';
import { AdminEmpty, AdminListCard } from '../../components/AdminModuleUI';
import { buildSemesterGroups, filterByYear, StudentGroup, UNASSIGNED_KEY } from './studentBrowseUtils';
import { useAdminStudents } from './useAdminStudents';

export const StudentSemestersScreen = ({ route, navigation }: any) => {
  const yearKey: string = route?.params?.yearKey ?? UNASSIGNED_KEY;
  const yearLabel: string = route?.params?.yearLabel ?? 'Students';
  const { students, diagnostics } = useAdminStudents();

  const yearStudents = useMemo(() => filterByYear(students, yearKey), [students, yearKey]);
  const semesterGroups = useMemo(() => buildSemesterGroups(yearStudents), [yearStudents]);

  const openSemester = (item: StudentGroup) => {
    navigation.navigate('StudentBranches', {
      yearKey,
      yearLabel,
      semesterKey: item.key,
      semesterLabel: item.label
    });
  };

  return (
    <ScreenShell>
      <AcropolisBackBar title={yearLabel} subtitle={`${yearStudents.length} students`} onBack={() => navigation.goBack()} />
      <FlatList
        data={semesterGroups}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            {diagnostics ? <Text style={styles.debugError}>{diagnostics}</Text> : null}
            <SectionLabel title="Semesters" />
          </>
        }
        ListEmptyComponent={<AdminEmpty title="No semesters found" subtitle="No students are assigned to this year yet." />}
        renderItem={({ item }) => (
          <AdminListCard
            iconKind="student"
            tone={item.key === UNASSIGNED_KEY ? 'amber' : 'indigo'}
            title={item.label}
            meta={`${item.count} student${item.count === 1 ? '' : 's'}`}
            caption="Browse branches"
            onPress={() => openSemester(item)}
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
