import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { api } from '../../api/client';
import { AcropolisBackBar, IconMark, ScreenShell, SectionLabel } from '../../components/AcropolisUI';
import { AdminFormCard, AdminOutlineButton, AdminPrimaryButton, AdminTextField } from '../../components/AdminModuleUI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getApiErrorMessage, handleSessionExpired } from '../../utils/apiErrors';
import { useAppTheme } from '../../styles/appTheme';

export const TeacherManagementScreen = ({ navigation }: any) => {
  const { logout } = useAuth();
  const { showToast } = useToast();
  const theme = useAppTheme();
  const [form, setForm] = useState({ username: '', password: '', teacherCode: '', name: '', admin: false });
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);

  const addTeacher = async () => {
    if (submitting) return;
    if (!form.username.trim() || !form.password.trim() || !form.teacherCode.trim() || !form.name.trim()) {
      showToast('Please fill all required teacher fields.', { type: 'info' });
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/api/admin/teachers', { ...form, subject: 'N/A' });
      setForm({ username: '', password: '', teacherCode: '', name: '', admin: false });
      showToast(form.admin ? 'Admin faculty account added.' : 'Teacher added.', { type: 'success' });
    } catch (e: any) {
      if (await handleSessionExpired(e, logout, showToast)) return;
      showToast(getApiErrorMessage(e, 'Unable to add teacher'), { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const importTeachers = async () => {
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
      const { data } = await api.post('/api/admin/teachers/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const imported = data?.importedCount ?? 0;
      const skipped = data?.skippedCount ?? 0;
      const errors = Array.isArray(data?.errors) ? data.errors as string[] : [];
      const sampleErrors = errors.slice(0, 3).join(' | ');

      showToast(`Import completed. Imported: ${imported}, Skipped: ${skipped}`, { type: 'success', duration: 3200 });
      if (sampleErrors) showToast(`Sample issues: ${sampleErrors}`, { type: 'info', duration: 3800 });
    } catch (e: any) {
      if (await handleSessionExpired(e, logout, showToast)) return;
      showToast(getApiErrorMessage(e, 'Unable to import teachers from file'), { type: 'error' });
    } finally {
      setImporting(false);
    }
  };

  return (
    <ScreenShell>
      <AcropolisBackBar title="Teacher Management" subtitle="Add faculty accounts" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <SectionLabel title="Teacher Import" />
        <View style={[styles.importCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
          <IconMark kind="teacher" tone="indigo" size={48} />
          <View style={styles.importCopy}>
            <AdminOutlineButton label={importing ? 'Importing...' : 'Import Teachers (Excel/PDF)'} onPress={importTeachers} disabled={importing || submitting} />
          </View>
        </View>

        <SectionLabel title="Add New Teacher" />
        <AdminFormCard title="Faculty Details" helper="Subject is stored as N/A for backend compatibility.">
          <AdminTextField label="Username *" value={form.username} onChangeText={(text) => setForm((p) => ({ ...p, username: text }))} autoCapitalize="none" />
          <AdminTextField label="Password *" value={form.password} onChangeText={(text) => setForm((p) => ({ ...p, password: text }))} secureTextEntry />
          <View style={styles.twoCol}>
            <AdminTextField label="Teacher Code *" value={form.teacherCode} onChangeText={(text) => setForm((p) => ({ ...p, teacherCode: text }))} style={styles.flexField} autoCapitalize="characters" />
            <AdminTextField label="Full Name *" value={form.name} onChangeText={(text) => setForm((p) => ({ ...p, name: text }))} style={styles.flexField} />
          </View>
          <View style={[styles.adminAccessRow, { backgroundColor: theme.blueSoft, borderColor: theme.border }]}>
            <View style={styles.adminAccessCopy}>
              <Text style={[styles.adminAccessTitle, { color: theme.ink }]}>Grant admin access</Text>
              <Text style={[styles.adminAccessHelper, { color: theme.muted }]}>This faculty account will be able to access all admin controls.</Text>
            </View>
            <Switch
              value={form.admin}
              onValueChange={(admin) => setForm((p) => ({ ...p, admin }))}
              disabled={submitting || importing}
              trackColor={{ false: theme.border, true: theme.blue }}
              thumbColor={form.admin ? '#FFFFFF' : theme.ghost}
            />
          </View>
          <AdminPrimaryButton label="Add Teacher" onPress={addTeacher} loading={submitting} disabled={submitting || importing} />
        </AdminFormCard>
      </ScrollView>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 28 },
  importCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EDE8E0', borderRadius: 18, padding: 13, flexDirection: 'row', gap: 12, marginBottom: 2, shadowColor: '#1C1917', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
  importCopy: { flex: 1 },
  twoCol: { flexDirection: 'row', gap: 10 },
  flexField: { flex: 1 },
  adminAccessRow: { borderWidth: 1, borderRadius: 16, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12 },
  adminAccessCopy: { flex: 1 },
  adminAccessTitle: { fontSize: 13, fontWeight: '900' },
  adminAccessHelper: { fontSize: 11, fontWeight: '700', marginTop: 3, lineHeight: 15 }
});
