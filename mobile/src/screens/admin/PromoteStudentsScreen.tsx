import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Button, Checkbox, Surface, Text } from 'react-native-paper';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { buttonStyles } from '../../styles/buttonStyles';
import { colors } from '../../styles/theme';
import { PromotionClassContext, StudentPromotionBatchDetail, StudentPromotionCandidate, StudentPromotionPreviewResponse, SubjectItem } from '../../types';

const YEAR_OPTIONS = ['1', '2', '3', '4'];
const SEMESTER_OPTIONS = ['1', '2', '3', '4', '5', '6', '7', '8'];
const SECTION_OPTIONS = ['1', '2', '3', '4', '5'];

const getNextContext = (from: PromotionClassContext): PromotionClassContext => {
  const fromSemester = Number(from.semester);
  if (!Number.isFinite(fromSemester) || fromSemester < 1 || fromSemester > 8) {
    return { ...from };
  }
  const nextSemester = Math.min(fromSemester + 1, 8);
  const nextYear = String(Math.ceil(nextSemester / 2));
  return {
    year: nextYear,
    semester: String(nextSemester),
    branch: from.branch,
    section: from.section
  };
};

export const PromoteStudentsScreen = ({ navigation }: any) => {
  const { logout } = useAuth();
  const { showToast } = useToast();
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [preview, setPreview] = useState<StudentPromotionPreviewResponse | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [from, setFrom] = useState<PromotionClassContext>({
    year: '',
    semester: '',
    branch: '',
    section: ''
  });

  const [to, setTo] = useState<PromotionClassContext>({
    year: '',
    semester: '',
    branch: '',
    section: ''
  });

  const branchOptions = useMemo(() => {
    const branches = new Set<string>();
    subjects.forEach((subject) => {
      const branch = subject.branch?.trim();
      if (branch) {
        branches.add(branch);
      }
    });
    return Array.from(branches).sort((a, b) => a.localeCompare(b));
  }, [subjects]);

  const handleAuthError = useCallback(async (error: any) => {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      showToast('Session expired. Please login again.', { type: 'error' });
      await logout();
      return true;
    }
    return false;
  }, [logout, showToast]);

  const loadBranches = useCallback(async () => {
    try {
      setLoadingBranches(true);
      const { data } = await api.get<SubjectItem[]>('/api/admin/subjects');
      setSubjects(Array.isArray(data) ? data : []);
    } catch (error: any) {
      if (await handleAuthError(error)) return;
      showToast(error?.response?.data?.message ?? 'Unable to load branch catalog.', { type: 'error' });
      setSubjects([]);
    } finally {
      setLoadingBranches(false);
    }
  }, [handleAuthError, showToast]);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  const toggleSelected = (studentId: number) => {
    setSelectedIds((prev) => (
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    ));
  };

  const canPreview = useMemo(
    () => [from.year, from.semester, from.branch, from.section].every((value) => value.trim().length > 0),
    [from]
  );

  const canExecute = useMemo(
    () => !!preview
      && selectedIds.length > 0
      && [to.year, to.semester, to.branch, to.section].every((value) => value.trim().length > 0),
    [preview, selectedIds.length, to]
  );

  const previewPromotion = async () => {
    if (!canPreview) {
      showToast('Please select Year, Semester, Branch and Section first.', { type: 'info' });
      return;
    }

    try {
      setLoadingPreview(true);
      const payload = { from };
      const { data } = await api.post<StudentPromotionPreviewResponse>('/api/admin/students/promotions/preview', payload);
      setPreview(data);
      const allIds = (data?.candidates ?? []).map((candidate) => candidate.id);
      setSelectedIds(allIds);
      setTo(getNextContext(from));
      showToast(`Preview loaded: ${data?.candidateCount ?? allIds.length} students`, { type: 'success' });
    } catch (error: any) {
      if (await handleAuthError(error)) return;
      showToast(error?.response?.data?.message ?? 'Unable to preview promotion.', { type: 'error' });
      setPreview(null);
      setSelectedIds([]);
    } finally {
      setLoadingPreview(false);
    }
  };

  const executePromotion = async () => {
    if (!canExecute) {
      showToast('Select students and target class before executing.', { type: 'info' });
      return;
    }

    try {
      setExecuting(true);
      const payload = {
        from,
        to,
        studentIds: selectedIds
      };
      const { data } = await api.post<StudentPromotionBatchDetail>('/api/admin/students/promotions/execute', payload);
      showToast(`Promotion completed. Promoted: ${data?.batch?.promotedCount ?? 0}`, { type: 'success' });
      if (data?.batch?.id) {
        navigation.navigate('PromotionBatchDetails', { batchId: data.batch.id });
      }
      setPreview(null);
      setSelectedIds([]);
    } catch (error: any) {
      if (await handleAuthError(error)) return;
      showToast(error?.response?.data?.message ?? 'Unable to execute promotion.', { type: 'error' });
    } finally {
      setExecuting(false);
    }
  };

  const renderCandidate = ({ item }: { item: StudentPromotionCandidate }) => {
    const checked = selectedIds.includes(item.id);
    return (
      <Surface style={styles.card} elevation={1}>
        <View style={styles.rowBetween}>
          <View style={styles.rowContent}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>Enrollment: {item.enrollmentNumber}</Text>
            <Text style={styles.meta}>Scholar: {item.scholarNumber}</Text>
          </View>
          <Checkbox
            status={checked ? 'checked' : 'unchecked'}
            onPress={() => toggleSelected(item.id)}
          />
        </View>
      </Surface>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Promote Students</Text>

      <Text style={styles.label}>Current Class</Text>
      <View style={styles.pickerWrap}>
        <Text style={styles.pickerLabel}>Year</Text>
        <Picker selectedValue={from.year} onValueChange={(value) => setFrom((prev) => ({ ...prev, year: String(value) }))} style={styles.picker}>
          <Picker.Item label="Select Year" value="" />
          {YEAR_OPTIONS.map((option) => <Picker.Item key={option} label={option} value={option} />)}
        </Picker>
      </View>

      <View style={styles.pickerWrap}>
        <Text style={styles.pickerLabel}>Semester</Text>
        <Picker selectedValue={from.semester} onValueChange={(value) => setFrom((prev) => ({ ...prev, semester: String(value) }))} style={styles.picker}>
          <Picker.Item label="Select Semester" value="" />
          {SEMESTER_OPTIONS.map((option) => <Picker.Item key={option} label={option} value={option} />)}
        </Picker>
      </View>

      <View style={styles.pickerWrap}>
        <Text style={styles.pickerLabel}>Branch</Text>
        <Picker selectedValue={from.branch} onValueChange={(value) => setFrom((prev) => ({ ...prev, branch: String(value) }))} style={styles.picker}>
          <Picker.Item label={loadingBranches ? 'Loading Branches...' : 'Select Branch'} value="" />
          {branchOptions.map((option) => <Picker.Item key={option} label={option} value={option} />)}
        </Picker>
      </View>

      <View style={styles.pickerWrap}>
        <Text style={styles.pickerLabel}>Section</Text>
        <Picker selectedValue={from.section} onValueChange={(value) => setFrom((prev) => ({ ...prev, section: String(value) }))} style={styles.picker}>
          <Picker.Item label="Select Section" value="" />
          {SECTION_OPTIONS.map((option) => <Picker.Item key={option} label={option} value={option} />)}
        </Picker>
      </View>

      <Button mode="contained" style={styles.button} contentStyle={buttonStyles.content} onPress={previewPromotion} loading={loadingPreview} disabled={loadingPreview}>
        Preview Students
      </Button>

      {preview ? (
        <>
          <Surface style={styles.summaryCard} elevation={1}>
            <Text style={styles.summaryTitle}>Preview Result</Text>
            <Text style={styles.meta}>Candidates: {preview.candidateCount}</Text>
            <Text style={styles.meta}>Selected: {selectedIds.length}</Text>
          </Surface>

          <Text style={styles.label}>Target Class</Text>
          <Button mode="contained-tonal" style={styles.smallButton} contentStyle={buttonStyles.content} onPress={() => setTo(getNextContext(from))}>
            Autofill Next Semester
          </Button>

          <View style={styles.pickerWrap}>
            <Text style={styles.pickerLabel}>Year</Text>
            <Picker selectedValue={to.year} onValueChange={(value) => setTo((prev) => ({ ...prev, year: String(value) }))} style={styles.picker}>
              <Picker.Item label="Select Year" value="" />
              {YEAR_OPTIONS.map((option) => <Picker.Item key={option} label={option} value={option} />)}
            </Picker>
          </View>

          <View style={styles.pickerWrap}>
            <Text style={styles.pickerLabel}>Semester</Text>
            <Picker selectedValue={to.semester} onValueChange={(value) => setTo((prev) => ({ ...prev, semester: String(value) }))} style={styles.picker}>
              <Picker.Item label="Select Semester" value="" />
              {SEMESTER_OPTIONS.map((option) => <Picker.Item key={option} label={option} value={option} />)}
            </Picker>
          </View>

          <View style={styles.pickerWrap}>
            <Text style={styles.pickerLabel}>Branch</Text>
            <Picker selectedValue={to.branch} onValueChange={(value) => setTo((prev) => ({ ...prev, branch: String(value) }))} style={styles.picker}>
              <Picker.Item label={loadingBranches ? 'Loading Branches...' : 'Select Branch'} value="" />
              {branchOptions.map((option) => <Picker.Item key={option} label={option} value={option} />)}
            </Picker>
          </View>

          <View style={styles.pickerWrap}>
            <Text style={styles.pickerLabel}>Section</Text>
            <Picker selectedValue={to.section} onValueChange={(value) => setTo((prev) => ({ ...prev, section: String(value) }))} style={styles.picker}>
              <Picker.Item label="Select Section" value="" />
              {SECTION_OPTIONS.map((option) => <Picker.Item key={option} label={option} value={option} />)}
            </Picker>
          </View>

          <Button
            mode="contained"
            style={styles.button}
            contentStyle={buttonStyles.content}
            onPress={executePromotion}
            loading={executing}
            disabled={executing || !canExecute}
          >
            Execute Promotion
          </Button>

          <FlatList
            data={preview.candidates}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderCandidate}
            style={styles.list}
            ListEmptyComponent={<Text style={styles.empty}>No students found for selected class.</Text>}
          />
        </>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: colors.bg },
  heading: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 8 },
  label: { color: colors.text, fontWeight: '700', marginTop: 8, marginBottom: 6 },
  pickerWrap: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 8,
    overflow: 'hidden'
  },
  pickerLabel: { color: colors.textMuted, fontSize: 12, marginTop: 8, marginHorizontal: 12 },
  picker: { color: colors.text },
  button: { borderRadius: 10, marginTop: 6 },
  smallButton: { borderRadius: 10, marginBottom: 6 },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    marginBottom: 6
  },
  summaryTitle: { color: colors.text, fontWeight: '700', marginBottom: 4 },
  meta: { color: colors.textMuted, marginTop: 2 },
  list: { marginTop: 10 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 10,
    marginBottom: 8,
    padding: 10
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowContent: { flex: 1, paddingRight: 8 },
  name: { color: colors.text, fontWeight: '700' },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 14 }
});
