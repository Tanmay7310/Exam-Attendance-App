import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Pressable } from 'react-native';
import { api } from '../../api/client';
import { ACR, AcropolisBackBar, ScreenShell, SectionLabel } from '../../components/AcropolisUI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SubjectItem } from '../../types';
import { getApiErrorMessage, handleSessionExpired } from '../../utils/apiErrors';

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
    () => Array.from(branchToSemesters.entries())
      .filter(([, semesters]) => !semester || semesters.includes(semester))
      .map(([branchName]) => branchName)
      .sort((a, b) => a.localeCompare(b)),
    [branchToSemesters, semester]
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
      if (await handleSessionExpired(e, logout, showToast)) return;
      showToast(getApiErrorMessage(e, 'Unable to load branches and semesters.'), { type: 'error' });
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

  const stepStatus = useMemo(() => {
    if (!year || !semester) return 1;
    if (!branch || !section) return 2;
    return 3;
  }, [year, semester, branch, section]);

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
    <ScreenShell>
      <AcropolisBackBar title="Enter Exam Details" subtitle="Session Configuration" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.introCard}>
          <Text style={styles.introTitle}>Configure exam session</Text>
          <Text style={styles.introText}>
            Select the exact class and subject before opening the scanner.
            {loadingCatalog ? ' Loading latest branch and subject catalog...' : ''}
          </Text>
        </View>

        <View style={styles.stepsCard}>
          <Step number="1" title="Year & Semester" active={stepStatus >= 1} complete={Boolean(year && semester)} />
          <Step number="2" title="Branch & Section" active={stepStatus >= 2} complete={Boolean(branch && section)} />
          <Step number="3" title="Subject" active={stepStatus >= 3} complete={Boolean(subject)} />
        </View>

        <SectionLabel title="Exam Details" />
        <View style={styles.formCard}>
          <PickerField label="Year" value={year}>
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
          </PickerField>

          <PickerField label="Semester" value={semester} disabled={semesterOptions.length === 0}>
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
          </PickerField>

          <PickerField label="Branch" value={branch}>
            <Picker
              selectedValue={branch}
              onValueChange={(value) => setBranch(String(value))}
              style={styles.picker}
            >
              <Picker.Item label={loadingCatalog ? 'Loading Branches...' : 'Select Branch'} value="" />
              {branchOptions.map((option) => (
                <Picker.Item key={option} label={option} value={option} />
              ))}
            </Picker>
          </PickerField>

          <PickerField label="Section" value={section}>
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
          </PickerField>

          <PickerField label="Subject" value={subject} disabled={!(branch.length > 0 && semester.length > 0 && year.length > 0 && subjectOptions.length > 0)}>
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
          </PickerField>
        </View>

        <Pressable onPress={proceedToScan} disabled={!canProceed} style={({ pressed }) => [styles.continueButton, !canProceed && styles.disabledButton, pressed && canProceed && styles.pressed]}>
          <Text style={styles.continueText}>Continue To Scan</Text>
        </Pressable>
      </ScrollView>
    </ScreenShell>
  );
};

const Step = ({ number, title, active, complete }: { number: string; title: string; active: boolean; complete: boolean }) => (
  <View style={styles.stepItem}>
    <View style={[styles.stepCircle, active && styles.stepCircleActive, complete && styles.stepCircleComplete]}>
      <Text style={[styles.stepNumber, active && styles.stepNumberActive]}>{complete ? 'OK' : number}</Text>
    </View>
    <Text style={[styles.stepTitle, active && styles.stepTitleActive]}>{title}</Text>
  </View>
);

const PickerField = ({ label, value, disabled, children }: { label: string; value: string; disabled?: boolean; children: React.ReactNode }) => (
  <View style={[styles.fieldWrap, disabled && styles.fieldDisabled, value.length > 0 && styles.fieldSelected]}>
    <View style={styles.fieldTopRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {value.length > 0 ? <Text style={styles.fieldCheck}>Selected</Text> : null}
    </View>
    {children}
  </View>
);

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 28 },
  introCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: ACR.border, borderRadius: 22, padding: 16 },
  introTitle: { color: ACR.ink, fontSize: 18, fontWeight: '900' },
  introText: { color: ACR.muted, marginTop: 6, lineHeight: 19 },
  stepsCard: { marginTop: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: ACR.border, borderRadius: 22, padding: 12, gap: 10 },
  stepItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepCircle: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: ACR.border, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  stepCircleActive: { borderColor: ACR.blue, backgroundColor: ACR.blueSoft },
  stepCircleComplete: { backgroundColor: ACR.blue, borderColor: ACR.blue },
  stepNumber: { color: ACR.ghost, fontSize: 12, fontWeight: '900' },
  stepNumberActive: { color: ACR.blue },
  stepTitle: { color: ACR.muted, fontSize: 13, fontWeight: '800' },
  stepTitleActive: { color: ACR.ink },
  formCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: ACR.border, borderRadius: 24, padding: 14, gap: 12 },
  fieldWrap: { borderWidth: 1, borderColor: ACR.border, borderRadius: 18, backgroundColor: '#FBFAF8', overflow: 'hidden' },
  fieldSelected: { borderColor: 'rgba(37,99,235,0.35)', backgroundColor: '#FFFFFF' },
  fieldDisabled: { opacity: 0.7 },
  fieldTopRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 11 },
  fieldLabel: { color: ACR.goldDeep, fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  fieldCheck: { color: ACR.blue, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  picker: { color: ACR.ink, marginTop: -4 },
  continueButton: { marginTop: 18, minHeight: 58, borderRadius: 18, backgroundColor: ACR.blue, alignItems: 'center', justifyContent: 'center', shadowColor: ACR.blue, shadowOpacity: 0.24, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 4 },
  disabledButton: { backgroundColor: '#A9B7D5', shadowOpacity: 0, elevation: 0 },
  pressed: { transform: [{ scale: 0.98 }] },
  continueText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' }
});
