import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Button, Text } from 'react-native-paper';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { buttonStyles } from '../../styles/buttonStyles';
import { colors } from '../../styles/theme';
import { SubjectItem } from '../../types';

export const EnterExamDetailsScreen = ({ navigation, route }: any) => {
  const returnTo = route?.params?.returnTo;
  const { auth, logout } = useAuth();
  const { showToast } = useToast();
  const [subject, setSubject] = useState('');
  const [branch, setBranch] = useState('');
  const [semester, setSemester] = useState('');
  const [year, setYear] = useState('');
  const [section, setSection] = useState('');
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  const branchToSemesters = useMemo(() => {
    const map = new Map<string, string[]>();

    subjects.forEach((item) => {
      const branchKey = item.branch?.trim() ?? '';
      const semesterValue = item.semester?.trim() ?? '';
      if (!branchKey || !semesterValue) return;
      if (!/^[1-8]$/.test(semesterValue)) return;

      const existing = map.get(branchKey) ?? [];
      if (!existing.includes(semesterValue)) {
        map.set(branchKey, [...existing, semesterValue].sort((a, b) => Number(a) - Number(b)));
      }
    });

    return map;
  }, [subjects]);

  const branchOptions = useMemo(
    () => Array.from(branchToSemesters.keys()).sort((a, b) => a.localeCompare(b)),
    [branchToSemesters]
  );

  const semesterOptions = useMemo(() => {
    if (year === '1') return ['1', '2'];
    if (year === '2') return ['3', '4'];
    if (year === '3') return ['5', '6'];
    if (year === '4') return ['7', '8'];
    return [];
  }, [year]);

  const subjectOptions = useMemo(() => {
    if (!branch || !semester || !year) return [];
    return subjects
      .filter((item) =>
        item.branch.trim().toLowerCase() === branch.trim().toLowerCase()
        && item.semester.trim() === semester.trim()
      )
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((item) => ({
        value: item.name.trim(),
        label: `${item.name.trim()} (${item.subjectCode.trim()})`
      }));
  }, [subjects, branch, semester, year]);

  const loadSubjects = useCallback(async () => {
    try {
      setLoadingCatalog(true);
      const endpoint = auth?.role === 'ADMIN' ? '/api/admin/subjects' : '/api/teacher/subjects';
      const { data } = await api.get<SubjectItem[]>(endpoint);
      setSubjects(Array.isArray(data) ? data : []);
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        showToast('Session expired. Please login again.', { type: 'error' });
        await logout();
        return;
      }
      showToast(e?.response?.data?.message ?? 'Unable to load branches and semesters.', { type: 'error' });
      setSubjects([]);
    } finally {
      setLoadingCatalog(false);
    }
  }, [auth?.role, logout, showToast]);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  useEffect(() => {
    if (branch && !branchOptions.includes(branch)) {
      setBranch('');
    }

    if (semester && !semesterOptions.includes(semester)) {
      setSemester('');
    }
  }, [branch, semester, branchOptions, semesterOptions]);

  useEffect(() => {
    if (subject && !subjectOptions.some((option) => option.value === subject)) {
      setSubject('');
    }
  }, [subject, subjectOptions]);

  const canProceed = useMemo(
    () =>
      [subject, branch, semester, year, section].every((v) => v.trim().length > 0)
      && !loadingCatalog,
    [subject, branch, semester, year, section, loadingCatalog]
  );

  const proceedToScan = () => {
    if (!canProceed) {
      showToast('Please enter Subject, Branch, Semester, Year and Section.', { type: 'info' });
      return;
    }

    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'Scan',
          params: {
            examDetails: {
              subject: subject.trim(),
              branch: branch.trim(),
              semester: semester.trim(),
              year: year.trim(),
              section: section.trim()
            },
            returnTo
          }
        }
      ]
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Enter Exam Details</Text>
      <Text style={styles.subText}>
        Fill in details before scanning student code.
        {loadingCatalog ? ' Loading latest branches and semesters...' : ''}
      </Text>

      <View style={styles.pickerWrap}>
        <Text style={styles.pickerLabel}>Year</Text>
        <Picker
          selectedValue={year}
          onValueChange={(value) => {
            const selectedYear = String(value);
            setYear(selectedYear);
            const allowedSemesters =
              selectedYear === '1' ? ['1', '2']
              : selectedYear === '2' ? ['3', '4']
              : selectedYear === '3' ? ['5', '6']
              : selectedYear === '4' ? ['7', '8']
              : [];
            if (!allowedSemesters.includes(semester)) {
              setSemester('');
            }
          }}
          style={styles.picker}
        >
          <Picker.Item label="Select Year" value="" />
          <Picker.Item label="1" value="1" />
          <Picker.Item label="2" value="2" />
          <Picker.Item label="3" value="3" />
          <Picker.Item label="4" value="4" />
        </Picker>
      </View>
      <View style={styles.pickerWrap}>
        <Text style={styles.pickerLabel}>Semester</Text>
        <Picker
          selectedValue={semester}
          onValueChange={(value) => setSemester(String(value))}
          style={styles.picker}
          enabled={semesterOptions.length > 0}
        >
          <Picker.Item label={semesterOptions.length > 0 ? 'Select Semester' : 'Select Year First'} value="" />
          {semesterOptions.map((option) => (
            <Picker.Item key={option} label={option} value={option} />
          ))}
        </Picker>
      </View>
      <View style={styles.pickerWrap}>
        <Text style={styles.pickerLabel}>Branch</Text>
        <Picker
          selectedValue={branch}
          onValueChange={(value) => {
            setBranch(String(value));
          }}
          style={styles.picker}
        >
          <Picker.Item label={loadingCatalog ? 'Loading Branches...' : 'Select Branch'} value="" />
          {branchOptions.map((option) => (
            <Picker.Item key={option} label={option} value={option} />
          ))}
        </Picker>
      </View>
      <View style={styles.pickerWrap}>
        <Text style={styles.pickerLabel}>Section</Text>
        <Picker
          selectedValue={section}
          onValueChange={(value) => setSection(String(value))}
          style={styles.picker}
        >
          <Picker.Item label="Select Section" value="" />
          <Picker.Item label="1" value="1" />
          <Picker.Item label="2" value="2" />
          <Picker.Item label="3" value="3" />
          <Picker.Item label="4" value="4" />
          <Picker.Item label="5" value="5" />
        </Picker>
      </View>
      <View style={styles.pickerWrap}>
        <Text style={styles.pickerLabel}>Subject</Text>
        <Picker
          selectedValue={subject}
          onValueChange={(value) => setSubject(String(value))}
          style={styles.picker}
          enabled={branch.length > 0 && semester.length > 0 && year.length > 0 && subjectOptions.length > 0}
        >
          <Picker.Item
            label={
              !year
                ? 'Select Year First'
                : !semester
                  ? 'Select Semester First'
                  : !branch
                    ? 'Select Branch First'
                    : subjectOptions.length > 0
                      ? 'Select Subject'
                      : 'No Subjects Found'
            }
            value=""
          />
          {subjectOptions.map((option) => (
            <Picker.Item key={option.label} label={option.label} value={option.value} />
          ))}
        </Picker>
      </View>

      <Button mode="contained" style={[styles.button, !canProceed && styles.buttonDisabled]} contentStyle={buttonStyles.content} disabled={!canProceed} onPress={proceedToScan}>
        Continue To Scan
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, backgroundColor: colors.bg },
  heading: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 6 },
  subText: { color: colors.textMuted, marginBottom: 16 },
  pickerWrap: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 10,
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
    marginTop: 8
  },
  buttonDisabled: {
    opacity: 0.7
  }
});
