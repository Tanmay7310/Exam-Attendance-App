import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { colors } from '../../styles/theme';
import { SubjectItem } from '../../types';

const SCHOLAR_PREFIX = 'AITR';
const YEAR_OPTIONS = ['1', '2', '3', '4'];
const SEMESTER_OPTIONS = ['1', '2', '3', '4', '5', '6', '7', '8'];
const SECTION_OPTIONS = ['1', '2', '3', '4', '5'];

export const AddStudentScreen = () => {
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
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        showToast('Session expired. Please login again.', { type: 'error' });
        await logout();
        return;
      }
      showToast(e?.response?.data?.message ?? 'Unable to load departments.', { type: 'error' });
      setSubjects([]);
    } finally {
      setLoadingDepartments(false);
    }
  }, [logout, showToast]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  const addStudent = async () => {
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
      await api.post('/api/admin/students', form);
      setForm({
        name: '',
        scholarNumber: '',
        enrollmentNumber: '',
        year: '',
        semester: '',
        department: '',
        section: ''
      });
      showToast('Student added.', { type: 'success' });
    } catch (e: any) {
      showToast(e?.response?.data?.message ?? 'Unable to add student', { type: 'error' });
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

      if (picked.canceled || !picked.assets?.length) {
        return;
      }

      const file = picked.assets[0];
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType ?? 'application/octet-stream'
      } as any);

      const { data } = await api.post('/api/admin/students/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const imported = data?.importedCount ?? 0;
      const skipped = data?.skippedCount ?? 0;
      const errors = Array.isArray(data?.errors) ? data.errors as string[] : [];
      const sampleErrors = errors.slice(0, 3).join('\n');

      showToast(`Import completed. Imported: ${imported}, Skipped: ${skipped}`, { type: 'success', duration: 3200 });
      if (sampleErrors) {
        showToast(`Sample issues: ${sampleErrors.replace(/\n/g, ' | ')}`, { type: 'info', duration: 3800 });
      }
    } catch (e: any) {
      showToast(e?.response?.data?.message ?? 'Unable to import students from file', { type: 'error' });
    }
  };

  return (
    <View style={styles.container}>
      <Pressable style={[styles.button, styles.importButton]} onPress={importStudents}>
        <Text style={styles.buttonText}>Import Students (Excel/PDF)</Text>
      </Pressable>

      <Text style={styles.h2}>Add Student</Text>
      <TextInput
        placeholder="name"
        style={styles.input}
        value={form.name}
        onChangeText={(text) => setForm((prev) => ({ ...prev, name: text }))}
      />
      <View style={styles.prefixInputRow}>
        <Text style={styles.prefixLabel}>{SCHOLAR_PREFIX}</Text>
        <TextInput
          placeholder="scholarNumber"
          style={styles.prefixInput}
          value={scholarSuffix}
          onChangeText={handleScholarNumberTyping}
        />
      </View>
      <TextInput
        placeholder="enrollmentNumber"
        style={styles.input}
        value={form.enrollmentNumber}
        onChangeText={(text) => setForm((prev) => ({ ...prev, enrollmentNumber: text }))}
      />

      <View style={styles.pickerWrap}>
        <Text style={styles.pickerLabel}>Year</Text>
        <Picker
          selectedValue={form.year}
          onValueChange={(value) => setForm((prev) => ({ ...prev, year: String(value) }))}
          style={styles.picker}
        >
          <Picker.Item label="Select Year" value="" />
          {YEAR_OPTIONS.map((value) => (
            <Picker.Item key={value} label={value} value={value} />
          ))}
        </Picker>
      </View>

      <View style={styles.pickerWrap}>
        <Text style={styles.pickerLabel}>Semester</Text>
        <Picker
          selectedValue={form.semester}
          onValueChange={(value) => setForm((prev) => ({ ...prev, semester: String(value) }))}
          style={styles.picker}
        >
          <Picker.Item label="Select Semester" value="" />
          {SEMESTER_OPTIONS.map((value) => (
            <Picker.Item key={value} label={value} value={value} />
          ))}
        </Picker>
      </View>

      <View style={styles.pickerWrap}>
        <Text style={styles.pickerLabel}>Department</Text>
        <Picker
          selectedValue={form.department}
          onValueChange={(value) => setForm((prev) => ({ ...prev, department: String(value) }))}
          style={styles.picker}
        >
          <Picker.Item label={loadingDepartments ? 'Loading Departments...' : 'Select Department'} value="" />
          {departmentOptions.map((value) => (
            <Picker.Item key={value} label={value} value={value} />
          ))}
        </Picker>
      </View>

      <View style={styles.pickerWrap}>
        <Text style={styles.pickerLabel}>Section</Text>
        <Picker
          selectedValue={form.section}
          onValueChange={(value) => setForm((prev) => ({ ...prev, section: String(value) }))}
          style={styles.picker}
        >
          <Picker.Item label="Select Section" value="" />
          {SECTION_OPTIONS.map((value) => (
            <Picker.Item key={value} label={value} value={value} />
          ))}
        </Picker>
      </View>

      <Pressable style={styles.button} onPress={addStudent}>
        <Text style={styles.buttonText}>Add Student</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: colors.bg },
  h2: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 7
  },
  prefixInputRow: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 7,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden'
  },
  prefixLabel: {
    color: colors.text,
    fontWeight: '700',
    paddingLeft: 10,
    paddingRight: 8
  },
  prefixInput: {
    flex: 1,
    color: colors.text,
    paddingVertical: 10,
    paddingRight: 10
  },
  pickerWrap: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 7,
    overflow: 'hidden'
  },
  pickerLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 8,
    marginHorizontal: 12
  },
  picker: {
    color: colors.text
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center'
  },
  importButton: {
    marginBottom: 12
  },
  buttonText: { color: 'white', fontWeight: '700' }
});
