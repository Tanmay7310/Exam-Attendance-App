import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { colors } from '../../styles/theme';

const DEPARTMENT_OPTIONS = [
  'CSE',
  'Cybersecurity',
  'CSIT',
  'Civil',
  'AIML',
  'IT',
  'Indian Language(IL)',
  'Mechanical'
];
const SCHOLAR_PREFIX = 'AITR';

const getSuggestionRank = (option: string, query: string) => {
  const normalizedOption = option.toLowerCase();
  const normalizedQuery = query.toLowerCase();

  if (normalizedOption === normalizedQuery) return 0;
  if (normalizedOption.startsWith(normalizedQuery)) return 1;

  const containsIndex = normalizedOption.indexOf(normalizedQuery);
  if (containsIndex >= 0) return 10 + containsIndex;

  return Number.MAX_SAFE_INTEGER;
};

export const AddStudentScreen = () => {
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
  const [departmentQuery, setDepartmentQuery] = useState('');
  const scholarSuffix = form.scholarNumber.startsWith(SCHOLAR_PREFIX)
    ? form.scholarNumber.slice(SCHOLAR_PREFIX.length)
    : form.scholarNumber;

  const departmentSuggestions = useMemo(() => {
    const query = departmentQuery.trim();
    if (!query) return [];

    const hasExactMatch = DEPARTMENT_OPTIONS.some(
      (option) => option.toLowerCase() === query.toLowerCase()
    );
    if (hasExactMatch) return [];

    return DEPARTMENT_OPTIONS
      .filter((option) => option.toLowerCase().includes(query.toLowerCase()))
      .sort((left, right) => {
        const leftRank = getSuggestionRank(left, query);
        const rightRank = getSuggestionRank(right, query);

        if (leftRank !== rightRank) return leftRank - rightRank;
        return DEPARTMENT_OPTIONS.indexOf(left) - DEPARTMENT_OPTIONS.indexOf(right);
      });
  }, [departmentQuery]);

  const addStudent = async () => {
    if (!form.scholarNumber || form.scholarNumber === SCHOLAR_PREFIX) {
      showToast('Please enter Scholar Number after AITR.', { type: 'info' });
      return;
    }

    if (!form.department) {
      showToast('Please select a department.', { type: 'info' });
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
      setDepartmentQuery('');
      showToast('Student added.', { type: 'success' });
    } catch (e: any) {
      showToast(e?.response?.data?.message ?? 'Unable to add student', { type: 'error' });
    }
  };

  const handleDepartmentTyping = (text: string) => {
    setDepartmentQuery(text);

    const exactMatch = DEPARTMENT_OPTIONS.find(
      (option) => option.toLowerCase() === text.trim().toLowerCase()
    );

    setForm((prev) => ({ ...prev, department: exactMatch ?? '' }));
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

      <TextInput
        placeholder="year"
        style={styles.input}
        value={form.year}
        onChangeText={(text) => setForm((prev) => ({ ...prev, year: text }))}
      />
      <TextInput
        placeholder="semester"
        style={styles.input}
        value={form.semester}
        onChangeText={(text) => setForm((prev) => ({ ...prev, semester: text }))}
      />
      <TextInput
        placeholder="department"
        style={styles.input}
        value={departmentQuery}
        onChangeText={handleDepartmentTyping}
      />

      {departmentSuggestions.length > 0 ? (
        <View style={styles.suggestionBox}>
          {departmentSuggestions.map((option) => (
            <Pressable
              key={option}
              style={styles.suggestionItem}
              onPress={() => {
                setDepartmentQuery(option);
                setForm((prev) => ({ ...prev, department: option }));
              }}
            >
              <Text style={styles.suggestionText}>{option}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <TextInput
        placeholder="section"
        style={styles.input}
        value={form.section}
        onChangeText={(text) => setForm((prev) => ({ ...prev, section: text }))}
      />

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
  suggestionBox: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    marginTop: -4,
    marginBottom: 7,
    overflow: 'hidden'
  },
  suggestionItem: {
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderBottomColor: colors.border,
    borderBottomWidth: 1
  },
  suggestionText: {
    color: colors.text,
    fontWeight: '600'
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
