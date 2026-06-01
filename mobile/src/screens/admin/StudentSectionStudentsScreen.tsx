import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text } from 'react-native';
import { api } from '../../api/client';
import { ACR, AcropolisBackBar, ScreenShell, SectionLabel } from '../../components/AcropolisUI';
import { AdminEmpty, AdminIconAction, AdminListCard, AdminSearchInput } from '../../components/AdminModuleUI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getApiErrorMessage, handleSessionExpired } from '../../utils/apiErrors';
import { filterByBranch, filterBySection, filterBySemester, filterByYear, UNASSIGNED_KEY } from './studentBrowseUtils';
import { useAdminStudents } from './useAdminStudents';

const includesSearch = (value: string | undefined | null, search: string) => (value ?? '').toLowerCase().includes(search);

export const StudentSectionStudentsScreen = ({ route, navigation }: any) => {
  const { logout } = useAuth();
  const { showToast } = useToast();
  const [studentSearch, setStudentSearch] = useState('');
  const yearKey: string = route?.params?.yearKey ?? UNASSIGNED_KEY;
  const yearLabel: string = route?.params?.yearLabel ?? 'Students';
  const semesterKey: string = route?.params?.semesterKey ?? UNASSIGNED_KEY;
  const semesterLabel: string = route?.params?.semesterLabel ?? 'Semester';
  const branchKey: string = route?.params?.branchKey ?? UNASSIGNED_KEY;
  const branchLabel: string = route?.params?.branchLabel ?? 'Branch';
  const sectionKey: string = route?.params?.sectionKey ?? UNASSIGNED_KEY;
  const sectionLabel: string = route?.params?.sectionLabel ?? 'Section';
  const { students, diagnostics, loadStudents } = useAdminStudents();

  const sectionStudents = useMemo(
    () => filterBySection(filterByBranch(filterBySemester(filterByYear(students, yearKey), semesterKey), branchKey), sectionKey),
    [branchKey, sectionKey, semesterKey, students, yearKey]
  );

  const filteredStudents = useMemo(() => {
    const search = studentSearch.trim().toLowerCase();
    return [...sectionStudents]
      .filter((student) => {
        if (!search) return true;
        return includesSearch(student.enrollmentNumber, search)
          || includesSearch(student.scholarNumber, search)
          || includesSearch(student.name, search)
          || includesSearch(student.department, search);
      })
      .sort((a, b) => (a.enrollmentNumber ?? '').localeCompare(b.enrollmentNumber ?? ''));
  }, [sectionStudents, studentSearch]);

  const removeStudent = async (id: number) => {
    try {
      await api.delete(`/api/admin/students/${id}`);
      await loadStudents();
      showToast('Student removed.', { type: 'success' });
    } catch (e: any) {
      if (await handleSessionExpired(e, logout, showToast)) return;
      showToast(getApiErrorMessage(e, 'Unable to remove student'), { type: 'error' });
    }
  };

  return (
    <ScreenShell>
      <AcropolisBackBar title={sectionLabel} subtitle={`${branchLabel} | ${semesterLabel}`} onBack={() => navigation.goBack()} />
      <FlatList
        data={filteredStudents}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            {diagnostics ? <Text style={styles.debugError}>{diagnostics}</Text> : null}
            <Text style={styles.contextText}>{yearLabel} | {semesterLabel} | {branchLabel} | {sectionLabel}</Text>
            <AdminSearchInput value={studentSearch} onChangeText={setStudentSearch} placeholder="Search students" />
            <SectionLabel title={studentSearch.trim() ? `Results (${filteredStudents.length})` : `Students (${sectionStudents.length})`} />
          </>
        }
        ListEmptyComponent={<AdminEmpty title="No students found" subtitle="Try a different search or go back to another class group." />}
        renderItem={({ item }) => (
          <AdminListCard
            iconKind="student"
            tone="blue"
            title={item.name}
            meta={`Scholar: ${item.scholarNumber || '-'} | Enrol: ${item.enrollmentNumber || '-'}`}
            caption={`${item.department || 'Unassigned Branch'} | Y${item.year || '-'} S${item.semester || '-'} | Section ${item.section || '-'}`}
            right={<AdminIconAction label="Remove" tone="rose" onPress={() => removeStudent(item.id)} />}
          />
        )}
      />
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 28 },
  contextText: { color: ACR.muted, fontSize: 12, fontWeight: '800', marginBottom: 12 },
  debugError: { color: ACR.rose, marginBottom: 8, fontSize: 12, fontWeight: '800' }
});
