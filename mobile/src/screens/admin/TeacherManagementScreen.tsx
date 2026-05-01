import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Button, Text, TextInput } from 'react-native-paper';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { buttonStyles } from '../../styles/buttonStyles';
import { colors } from '../../styles/theme';

export const TeacherManagementScreen = () => {
  const { logout } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({ username: '', password: '', teacherCode: '', name: '' });

  const addTeacher = async () => {
    try {
      await api.post('/api/admin/teachers', { ...form, subject: 'N/A' });
      setForm({ username: '', password: '', teacherCode: '', name: '' });
      showToast('Teacher added.', { type: 'success' });
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        showToast('Session expired. Please login again.', { type: 'error' });
        await logout();
        return;
      }
      showToast(e?.response?.data?.message ?? e?.message ?? 'Unable to add teacher', { type: 'error' });
    }
  };

  const importTeachers = async () => {
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

      const { data } = await api.post('/api/admin/teachers/import', formData, {
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
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        showToast('Session expired. Please login again.', { type: 'error' });
        await logout();
        return;
      }
      showToast(e?.response?.data?.message ?? 'Unable to import teachers from file', { type: 'error' });
    }
  };

  return (
    <View style={styles.container}>
      <Button mode="contained" style={styles.importButton} contentStyle={buttonStyles.content} onPress={importTeachers}>
        Import Teachers (Excel/PDF)
      </Button>
      <Text style={styles.h2}>Add Teacher</Text>
      {['username', 'password', 'teacherCode', 'name'].map((field) => (
        <TextInput
          key={field}
          label={field}
          mode="outlined"
          style={styles.input}
          value={(form as any)[field]}
          onChangeText={(text) => setForm((p) => ({ ...p, [field]: text }))}
          secureTextEntry={field === 'password'}
        />
      ))}
      <Button mode="contained" contentStyle={buttonStyles.content} onPress={addTeacher}>Add</Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: colors.bg },
  h2: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 },
  input: {
    marginBottom: 7
  },
  importButton: { borderRadius: 12, marginBottom: 12 }
});
