import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../api/client';
import { ACR, AcropolisBackBar, EmptyState, IconMark, ScreenShell, SectionLabel } from '../../components/AcropolisUI';
import { AdminOutlineButton, AdminPrimaryButton, AdminTextField } from '../../components/AdminModuleUI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SessionAttendanceSummary } from '../../types';
import { getApiErrorMessage, handleSessionExpired } from '../../utils/apiErrors';
import { useAppTheme } from '../../styles/appTheme';

const isValidDateParam = (value: string) => {
  if (!value.trim()) return true;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsedUtc = new Date(Date.UTC(year, month - 1, day));

  return parsedUtc.getUTCFullYear() === year
    && parsedUtc.getUTCMonth() === month - 1
    && parsedUtc.getUTCDate() === day;
};

export const AttendanceMonitoringScreen = ({ navigation }: any) => {
  const { auth, logout } = useAuth();
  const { showToast } = useToast();
  const theme = useAppTheme();
  const [date, setDate] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [subject, setSubject] = useState('');
  const [sessionSummaries, setSessionSummaries] = useState<SessionAttendanceSummary[]>([]);

  const fetchSessions = useCallback(async () => {
    const dateValue = date.trim();
    if (!isValidDateParam(dateValue)) {
      return;
    }

    const params: any = {};
    if (dateValue) params.date = dateValue;
    if (teacherId) params.teacherId = teacherId.trim();
    if (subject) params.subject = subject;

    const { data } = await api.get<SessionAttendanceSummary[]>('/api/admin/attendance/sessions', { params });
    setSessionSummaries(data);
  }, [date, teacherId, subject]);

  useFocusEffect(
    useCallback(() => {
      fetchSessions().catch(async (e: any) => {
        if (await handleSessionExpired(e, logout, showToast)) return;
        showToast(getApiErrorMessage(e, 'Failed to load attendance records.'), { type: 'error' });
      });
    }, [fetchSessions, logout, showToast])
  );

  const exportPdf = async () => {
    try {
      const dateValue = date.trim();
      if (!isValidDateParam(dateValue)) {
        showToast('Please enter date in YYYY-MM-DD format.', { type: 'info' });
        return;
      }

      const params: string[] = [];
      if (dateValue) params.push(`date=${encodeURIComponent(dateValue)}`);
      if (teacherId) params.push(`teacherId=${encodeURIComponent(teacherId)}`);
      if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
      const query = params.length ? `?${params.join('&')}` : '';

      const fileUri = `${FileSystem.documentDirectory}admin-attendance-${Date.now()}.pdf`;
      const url = `${api.defaults.baseURL}/api/admin/attendance/report/pdf${query}`;

      await FileSystem.downloadAsync(url, fileUri, {
        headers: {
          Authorization: `Bearer ${auth?.token ?? ''}`
        }
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        showToast(`PDF saved at ${fileUri}`, { type: 'success', duration: 3200 });
      }
    } catch (e: any) {
      if (await handleSessionExpired(e, logout, showToast)) return;
      showToast(getApiErrorMessage(e, 'Unable to generate PDF'), { type: 'error' });
    }
  };

  const clearFilters = () => {
    setDate('');
    setTeacherId('');
    setSubject('');
  };

  const sessions = useMemo(() => {
    const grouped = new Map<string, { date: string; sessions: SessionAttendanceSummary[] }>();

    sessionSummaries.forEach((summary) => {
      const rowDate = summary.date;
      const key = rowDate;

      if (!grouped.has(key)) {
        grouped.set(key, { date: rowDate, sessions: [] });
      }
      grouped.get(key)?.sessions.push(summary);
    });

    return Array.from(grouped.values())
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((group) => ({
        title: `Date: ${group.date}`,
        date: group.date,
        sessionCount: group.sessions.length,
        presentCount: group.sessions.reduce((sum, item) => sum + item.presentCount, 0),
        totalCount: group.sessions.reduce((sum, item) => sum + item.totalCount, 0),
        sessions: group.sessions.sort((a, b) => (a.subject ?? '').localeCompare(b.subject ?? ''))
      }));
  }, [sessionSummaries]);

  const hasFilters = date.trim().length > 0 || teacherId.trim().length > 0 || subject.trim().length > 0;

  return (
    <ScreenShell>
      <AcropolisBackBar title="Attendance Monitoring" subtitle="Date-wise summary" onBack={() => navigation.goBack()} />
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.date}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <View style={[styles.filterCard, { backgroundColor: theme.card, borderColor: hasFilters ? theme.blue : theme.border, shadowColor: theme.shadow }]}>
              <View style={styles.filterHeader}>
                <Text style={[styles.filterTitle, { color: theme.ink }]}>Filters</Text>
                {hasFilters ? <Text style={[styles.activeBadge, { color: theme.blue, backgroundColor: theme.blueSoft, borderColor: theme.blue }]}>Active</Text> : null}
              </View>
              <AdminTextField label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} style={styles.input} autoCorrect={false} />
              <AdminTextField label="Teacher (ID / Code / Name)" value={teacherId} onChangeText={setTeacherId} style={styles.input} autoCorrect={false} />
              <AdminTextField label="Subject" value={subject} onChangeText={setSubject} style={styles.input} autoCorrect={false} />
              <View style={styles.actionRow}>
                <View style={styles.actionButton}>
                  <AdminOutlineButton label="Clear Filters" onPress={clearFilters} disabled={!hasFilters} tone="rose" />
                </View>
                <View style={styles.actionButton}>
                  <AdminPrimaryButton label="Export PDF" onPress={exportPdf} />
                </View>
              </View>
            </View>
            <SectionLabel title="Date-wise Summary" />
          </>
        }
        ListEmptyComponent={<EmptyState title="No matching records" subtitle="No attendance records match the current filters." />}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.dateCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }, pressed && styles.pressed]}
            onPress={() =>
              navigation.navigate('AdminAttendanceSubjects', {
                date: item.date,
                sessions: item.sessions,
                teacherId,
                subjectFilter: subject
              })
            }
          >
            <IconMark kind="activity" tone="blue" size={48} />
            <View style={styles.dateCopy}>
              <Text style={[styles.dateTitle, { color: theme.ink }]}>{item.title}</Text>
              <Text style={[styles.dateMeta, { color: theme.muted }]}>
                {item.sessionCount} session{item.sessionCount === 1 ? '' : 's'} | {item.presentCount}/{item.totalCount} present
              </Text>
            </View>
            <Text style={[styles.chevron, { color: theme.ghost }]}>{'>'}</Text>
          </Pressable>
        )}
      />
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 28 },
  filterCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: ACR.border, borderRadius: 24, padding: 14, shadowColor: '#1C1917', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  filterCardActive: { borderColor: 'rgba(37,99,235,0.45)' },
  filterHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  filterTitle: { color: ACR.ink, fontSize: 16, fontWeight: '900' },
  activeBadge: { color: ACR.blue, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#DBEAFE', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  input: { marginBottom: 10 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionButton: { flex: 1 },
  dateCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: ACR.border, borderRadius: 20, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 11, shadowColor: '#1C1917', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
  dateCopy: { flex: 1 },
  dateTitle: { color: ACR.ink, fontSize: 15, fontWeight: '900' },
  dateMeta: { color: ACR.muted, fontSize: 12, marginTop: 4 },
  chevron: { color: '#D1D5DB', fontSize: 24, fontWeight: '900' },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.9 }
});
