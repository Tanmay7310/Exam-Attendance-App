import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text } from 'react-native';
import { ACR, AcropolisBackBar, ScreenShell, SectionLabel } from '../../components/AcropolisUI';
import { AdminEmpty, AdminListCard } from '../../components/AdminModuleUI';
import { buildSectionGroups, filterByBranch, filterBySemester, filterByYear, StudentGroup, UNASSIGNED_KEY } from './studentBrowseUtils';
import { useAdminStudents } from './useAdminStudents';

export const StudentSectionsScreen = ({ route, navigation }: any) => {
  const yearKey: string = route?.params?.yearKey ?? UNASSIGNED_KEY;
  const yearLabel: string = route?.params?.yearLabel ?? 'Students';
  const semesterKey: string = route?.params?.semesterKey ?? UNASSIGNED_KEY;
  const semesterLabel: string = route?.params?.semesterLabel ?? 'Semester';
  const branchKey: string = route?.params?.branchKey ?? UNASSIGNED_KEY;
  const branchLabel: string = route?.params?.branchLabel ?? 'Branch';
  const { students, diagnostics } = useAdminStudents();

  const scopedStudents = useMemo(
    () => filterByBranch(filterBySemester(filterByYear(students, yearKey), semesterKey), branchKey),
    [branchKey, semesterKey, students, yearKey]
  );
  const sectionGroups = useMemo(() => buildSectionGroups(scopedStudents), [scopedStudents]);

  const openSection = (item: StudentGroup) => {
    navigation.navigate('StudentSectionStudents', {
      yearKey,
      yearLabel,
      semesterKey,
      semesterLabel,
      branchKey,
      branchLabel,
      sectionKey: item.key,
      sectionLabel: item.label
    });
  };

  return (
    <ScreenShell>
      <AcropolisBackBar title={branchLabel} subtitle={`${yearLabel} | ${semesterLabel}`} onBack={() => navigation.goBack()} />
      <FlatList
        data={sectionGroups}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            {diagnostics ? <Text style={styles.debugError}>{diagnostics}</Text> : null}
            <SectionLabel title="Sections" />
          </>
        }
        ListEmptyComponent={<AdminEmpty title="No sections found" subtitle="No students are assigned to this branch yet." />}
        renderItem={({ item }) => (
          <AdminListCard
            iconKind="student"
            tone={item.key === UNASSIGNED_KEY ? 'amber' : 'blue'}
            title={item.label}
            meta={`${item.count} student${item.count === 1 ? '' : 's'}`}
            caption="View student records"
            onPress={() => openSection(item)}
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
