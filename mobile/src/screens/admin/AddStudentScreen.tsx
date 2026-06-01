import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';
import { api } from '../../api/client';
import { AcropolisBackBar, ScreenShell, SectionLabel } from '../../components/AcropolisUI';
import { AdminFormCard, AdminPickerFrame, AdminPrimaryButton, AdminTextField, adminStyles } from '../../components/AdminModuleUI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ACR } from '../../components/AcropolisUI';
import { SubjectItem } from '../../types';
import { getApiErrorMessage, handleSessionExpired } from '../../utils/apiErrors';

const SCHOLAR_PREFIX = 'AITR';
const YEAR_OPTIONS = ['1', '2', '3', '4'];
const SEMESTER_OPTIONS = ['1', '2', '3', '4', '5', '6', '7', '8'];
const SECTION_OPTIONS = ['1', '2', '3', '4', '5'];

export const AddStudentScreen = ({ navigation }: any) => {
  const { logout } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: '',
    scholarNumber: '',
    enrollmentNumber: '',
    year: '',
    semester: '',
    department: '',
    section: ''
  });
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);

  const scholarSuffix = form.scholarNumber.startsWith(SCHOLAR_PREFIX)
    ? form.scholarNumber.slice(SCHOLAR_PREFIX.length)
    : form.scholarNumber;

  const departmentOptions = useMemo(() => {
    const map = new Map<string, true>();
    subjects.forEach((item) => {
      const branch = item.branch?.trim() ?? '';
      const semester = item.semester?.trim() ?? '';
      if (!branch || !semester) return;
      if (!/^[1-8]$/.test(semester)) return;
      map.set(branch, true);
    });
    return Array.from(map.keys()).sort((a, b) => a.localeCompare(b));
  }, [subjects]);

  const loadDepartments = useCallback(async () => {
    try {
      setLoadingDepartments(true);
      const { data } = await api.get<SubjectItem[]>('/api/admin/subjects');
      setSubjects(Array.isArray(data) ? data : []);
    } catch (e: any) {
      if (await handleSessionExpired(e, logout, showToast)) return;
      showToast(getApiErrorMessage(e, 'Unable to load departments.'), { type: 'error' });
      setSubjects([]);
    } finally {
      setLoadingDepartments(false);
    }
  }, [logout, showToast]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  const addStudent = async () => {
    if (submitting) return;
    if (!form.scholarNumber || form.scholarNumber === SCHOLAR_PREFIX) {
      showToast('Please enter Scholar Number after AITR.', { type: 'info' });
      return;
    }
    if (!form.department) {
      showToast('Please select a department.', { type: 'info' });
      return;
    }
    if (!form.year.trim()) {
      showToast('Please select year.', { type: 'info' });
      return;
    }
    if (!form.semester.trim()) {
      showToast('Please select semester.', { type: 'info' });
      return;
    }
    if (!form.section.trim()) {
      showToast('Please select section.', { type: 'info' });
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/api/admin/students', form);
      setForm({ name: '', scholarNumber: '', enrollmentNumber: '', year: '', semester: '', department: '', section: '' });
      showToast('Student added.', { type: 'success' });
    } catch (e: any) {
      if (await handleSessionExpired(e, logout, showToast)) return;
      showToast(getApiErrorMessage(e, 'Unable to add student'), { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleScholarNumberTyping = (text: string) => {
    const normalized = text.trimStart();
    const withoutPrefix = normalized.toUpperCase().startsWith(SCHOLAR_PREFIX)
      ? normalized.slice(SCHOLAR_PREFIX.length)
      : normalized;
    setForm((prev) => ({ ...prev, scholarNumber: `${SCHOLAR_PREFIX}${withoutPrefix}` }));
  };

  const importStudents = async () => {
    if (importing) return;
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ],
        multiple: false,
        copyToCacheDirectory: true
      });

      if (picked.canceled || !picked.assets?.length) return;

      const file = picked.assets[0];
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType ?? 'application/octet-stream'
      } as any);

      setImporting(true);
      const { data } = await api.post('/api/admin/students/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const imported = data?.importedCount ?? 0;
      const skipped = data?.skippedCount ?? 0;
      const errors = Array.isArray(data?.errors) ? data.errors as string[] : [];
      const sampleErrors = errors.slice(0, 3).join(' | ');
      showToast(`Import completed. Imported: ${imported}, Skipped: ${skipped}`, { type: 'success', duration: 3200 });
      if (sampleErrors) showToast(`Sample issues: ${sampleErrors}`, { type: 'info', duration: 3800 });
    } catch (e: any) {
      if (await handleSessionExpired(e, logout, showToast)) return;
      showToast(getApiErrorMessage(e, 'Unable to import students from file'), { type: 'error' });
    } finally {
      setImporting(false);
    }
  };

  return (
    <ScreenShell>
      <AcropolisBackBar title="Add Student" subtitle="Student profile setup" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <SectionLabel title="Student Import" />
        <Pressable style={({ pressed }) => [styles.importCard, pressed && adminStyles.pressed]} onPress={importStudents} disabled={importing || submitting}>
          <Text style={styles.importTitle}>{importing ? 'Importing...' : 'Import Students (Excel/PDF)'}</Text>
          <Text style={styles.importMeta}>Upload roster files without changing manual add flow</Text>
        </Pressable>

        <SectionLabel title="Add New Student" />
        <AdminFormCard title="Student Details" helper="Class context is used later for strict scan validation.">
          <AdminTextField label="Full Name" value={form.name} onChangeText={(text) => setForm((prev) => ({ ...prev, name: text }))} />
          <View>
            <Text style={adminStyles.fieldLabel}>Scholar Number</Text>
            <View style={styles.prefixInputRow}>
              <Text style={styles.prefixLabel}>{SCHOLAR_PREFIX}</Text>
              <TextInput
                placeholder="23-0024"
                placeholderTextColor={ACR.ghost}
                style={styles.prefixInput}
                value={scholarSuffix}
                onChangeText={handleScholarNumberTyping}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>
          </View>
          <AdminTextField label="Enrollment Number" value={form.enrollmentNumber} onChangeText={(text) => setForm((prev) => ({ ...prev, enrollmentNumber: text }))} autoCapitalize="characters" />

          <View style={styles.twoCol}>
            <AdminPickerFrame label="Year" style={styles.flexField}>
              <Picker selectedValue={form.year} onValueChange={(value) => setForm((prev) => ({ ...prev, year: String(value) }))} style={styles.picker}>
                <Picker.Item label="Select Year" value="" />
                {YEAR_OPTIONS.map((value) => <Picker.Item key={value} label={value} value={value} />)}
              </Picker>
            </AdminPickerFrame>
            <AdminPickerFrame label="Semester" style={styles.flexField}>
              <Picker selectedValue={form.semester} onValueChange={(value) => setForm((prev) => ({ ...prev, semester: String(value) }))} style={styles.picker}>
                <Picker.Item label="Select Semester" value="" />
                {SEMESTER_OPTIONS.map((value) => <Picker.Item key={value} label={value} value={value} />)}
              </Picker>
            </AdminPickerFrame>
          </View>

          <AdminPickerFrame label="Department">
            <Picker selectedValue={form.department} onValueChange={(value) => setForm((prev) => ({ ...prev, department: String(value) }))} style={styles.picker}>
              <Picker.Item label={loadingDepartments ? 'Loading Departments...' : 'Select Department'} value="" />
              {departmentOptions.map((value) => <Picker.Item key={value} label={value} value={value} />)}
            </Picker>
          </AdminPickerFrame>

          <AdminPickerFrame label="Section">
            <Picker selectedValue={form.section} onValueChange={(value) => setForm((prev) => ({ ...prev, section: String(value) }))} style={styles.picker}>
              <Picker.Item label="Select Section" value="" />
              {SECTION_OPTIONS.map((value) => <Picker.Item key={value} label={value} value={value} />)}
            </Picker>
          </AdminPickerFrame>

          <AdminPrimaryButton label="Add Student" onPress={addStudent} loading={submitting} disabled={submitting || importing} />
        </AdminFormCard>
      </ScrollView>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 28 },
  importCard: { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#DBEAFE', borderRadius: 18, padding: 14, marginBottom: 2 },
  importTitle: { color: ACR.blue, fontSize: 14, fontWeight: '900' },
  importMeta: { color: ACR.muted, fontSize: 11, fontWeight: '700', marginTop: 3 },
  prefixInputRow: { minHeight: 50, borderWidth: 1, borderColor: ACR.border, borderRadius: 14, backgroundColor: '#F9FAFB', flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  prefixLabel: { color: ACR.ink, fontWeight: '900', paddingLeft: 14, paddingRight: 8 },
  prefixInput: { flex: 1, color: ACR.ink, paddingVertical: 10, paddingRight: 14, fontSize: 14, fontWeight: '700' },
  picker: { color: ACR.ink },
  twoCol: { flexDirection: 'row', gap: 10 },
  flexField: { flex: 1 }
});
