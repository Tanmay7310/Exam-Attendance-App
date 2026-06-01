import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text } from 'react-native';
import { ACR, AcropolisBackBar, ScreenShell, SectionLabel } from '../../components/AcropolisUI';
import { AdminEmpty, AdminListCard } from '../../components/AdminModuleUI';
import { buildBranchGroups, filterBySemester, filterByYear, StudentGroup, UNASSIGNED_KEY } from './studentBrowseUtils';
import { useAdminStudents } from './useAdminStudents';

export const StudentBranchesScreen = ({ route, navigation }: any) => {
  const yearKey: string = route?.params?.yearKey ?? UNASSIGNED_KEY;
  const yearLabel: string = route?.params?.yearLabel ?? 'Students';
  const semesterKey: string = route?.params?.semesterKey ?? UNASSIGNED_KEY;
  const semesterLabel: string = route?.params?.semesterLabel ?? 'Semester';
  const { students, diagnostics } = useAdminStudents();

  const scopedStudents = useMemo(
    () => filterBySemester(filterByYear(students, yearKey), semesterKey),
    [semesterKey, students, yearKey]
  );
  const branchGroups = useMemo(() => buildBranchGroups(scopedStudents), [scopedStudents]);

  const openBranch = (item: StudentGroup) => {
    navigation.navigate('StudentSections', {
      yearKey,
      yearLabel,
      semesterKey,
      semesterLabel,
      branchKey: item.key,
      branchLabel: item.label
    });
  };

  return (
    <ScreenShell>
      <AcropolisBackBar title={semesterLabel} subtitle={yearLabel} onBack={() => navigation.goBack()} />
      <FlatList
        data={branchGroups}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            {diagnostics ? <Text style={styles.debugError}>{diagnostics}</Text> : null}
            <SectionLabel title="Branches" />
          </>
        }
        ListEmptyComponent={<AdminEmpty title="No branches found" subtitle="No students are assigned to this semester yet." />}
        renderItem={({ item }) => (
          <AdminListCard
            iconKind="student"
            tone={item.key === UNASSIGNED_KEY ? 'amber' : 'green'}
            title={item.label}
            meta={`${item.count} student${item.count === 1 ? '' : 's'}`}
            caption="Browse sections"
            onPress={() => openBranch(item)}
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
