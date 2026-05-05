import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { API_BASE_URL, api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { buttonStyles } from '../../styles/buttonStyles';
import { colors } from '../../styles/theme';

export const AddNewSubjectsScreen = () => {
  const { logout } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [branch, setBranch] = useState('');
  const [semester, setSemester] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const addSubject = async () => {
    if (submitting) return;

    if (!name.trim() || !subjectCode.trim() || !branch.trim() || !semester.trim()) {
      showToast('Please enter Subject Name, Subject Code, Branch and Semester.', { type: 'info' });
      return;
    }

    try {
      setSubmitting(true);
      showToast('Adding subject...', { type: 'info', duration: 1200 });

      await api.post('/api/admin/subjects', {
        name: name.trim(),
        subjectCode: subjectCode.trim(),
        branch: branch.trim(),
        semester: semester.trim()
      });
      setName('');
      setSubjectCode('');
      setBranch('');
      setSemester('');
      showToast('Subject added successfully.', { type: 'success' });
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        showToast('Session expired. Please login again.', { type: 'error' });
        await logout();
        return;
      }
      const message =
        (typeof e?.response?.data === 'string' && e.response.data.trim())
        || e?.response?.data?.message
        || e?.message
        || 'Unable to add subject.';
      if (e?.message === 'Network Error') {
        showToast(`Network error. API: ${API_BASE_URL}`, { type: 'error', duration: 4200 });
      } else {
        showToast(message, { type: 'error' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.h2}>Add New Subject</Text>

      <TextInput label="Subject Name" mode="outlined" style={styles.input} value={name} onChangeText={setName} />
      <TextInput label="Subject Code" mode="outlined" style={styles.input} value={subjectCode} onChangeText={setSubjectCode} />
      <TextInput label="Branch" mode="outlined" style={styles.input} value={branch} onChangeText={setBranch} />
      <TextInput label="Semester" mode="outlined" style={styles.input} value={semester} onChangeText={setSemester} />

      <Button mode="contained" contentStyle={buttonStyles.content} onPress={addSubject} loading={submitting} disabled={submitting}>
        Add Subject
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: colors.bg },
  h2: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 },
  input: { marginBottom: 8 }
});

