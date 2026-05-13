import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Button, Surface, Text, TouchableRipple } from 'react-native-paper';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { buttonStyles } from '../../styles/buttonStyles';
import { colors } from '../../styles/theme';
import { StudentPromotionBatchSummary } from '../../types';

const formatClass = (year: string, semester: string, branch: string, section: string) =>
  `Y${year} S${semester} | ${branch} | Section ${section}`;

export const PromotionHistoryScreen = ({ navigation }: any) => {
  const { logout } = useAuth();
  const { showToast } = useToast();
  const [batches, setBatches] = useState<StudentPromotionBatchSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get<StudentPromotionBatchSummary[]>('/api/admin/students/promotions');
      setBatches(Array.isArray(data) ? data : []);
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        showToast('Session expired. Please login again.', { type: 'error' });
        await logout();
        return;
      }
      showToast(error?.response?.data?.message ?? 'Unable to load promotion history.', { type: 'error' });
      setBatches([]);
    } finally {
      setLoading(false);
    }
  }, [logout, showToast]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return (
    <View style={styles.container}>
      <Button mode="contained" style={styles.button} contentStyle={buttonStyles.content} onPress={loadHistory} loading={loading}>
        Refresh History
      </Button>

      <FlatList
        data={batches}
        keyExtractor={(item) => String(item.id)}
        style={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No promotion batches found.</Text>}
        renderItem={({ item }) => (
          <Surface style={styles.card} elevation={1}>
            <TouchableRipple style={styles.press} onPress={() => navigation.navigate('PromotionBatchDetails', { batchId: item.id })}>
              <View>
                <Text style={styles.title}>Batch #{item.id} | {item.status}</Text>
                <Text style={styles.meta}>From: {formatClass(item.fromYear, item.fromSemester, item.fromBranch, item.fromSection)}</Text>
                <Text style={styles.meta}>To: {formatClass(item.toYear, item.toSemester, item.toBranch, item.toSection)}</Text>
                <Text style={styles.meta}>Promoted: {item.promotedCount}, Skipped: {item.skippedCount}, Failed: {item.failedCount}</Text>
                <Text style={styles.meta}>By: {item.promotedBy} | {new Date(item.promotedAt).toLocaleString()}</Text>
              </View>
            </TouchableRipple>
          </Surface>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: colors.bg },
  button: { borderRadius: 10 },
  list: { marginTop: 10 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8
  },
  press: { padding: 10 },
  title: { color: colors.text, fontWeight: '700', marginBottom: 4 },
  meta: { color: colors.textMuted, marginTop: 2 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 18 }
});
