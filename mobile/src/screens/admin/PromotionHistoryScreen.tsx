import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { api } from '../../api/client';
import { AcropolisBackBar, ScreenShell, SectionLabel } from '../../components/AcropolisUI';
import { AdminEmpty, AdminListCard, AdminOutlineButton } from '../../components/AdminModuleUI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { StudentPromotionBatchSummary } from '../../types';
import { getApiErrorMessage, handleSessionExpired } from '../../utils/apiErrors';

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
      if (await handleSessionExpired(error, logout, showToast)) return;
      showToast(getApiErrorMessage(error, 'Unable to load promotion history.'), { type: 'error' });
      setBatches([]);
    } finally {
      setLoading(false);
    }
  }, [logout, showToast]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  return (
    <ScreenShell>
      <AcropolisBackBar title="Promotion History" subtitle={`${batches.length} batches`} onBack={() => navigation.goBack()} />
      <FlatList
        data={batches}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <AdminOutlineButton label={loading ? 'Refreshing...' : 'Refresh History'} onPress={loadHistory} disabled={loading} />
            <SectionLabel title="Batches" />
          </>
        }
        ListEmptyComponent={<AdminEmpty title="No promotion batches found" subtitle="Completed promotions will appear here." />}
        renderItem={({ item }) => (
          <AdminListCard
            iconKind="history"
            tone="green"
            title={`Batch #${item.id} | ${item.status}`}
            meta={`From: ${formatClass(item.fromYear, item.fromSemester, item.fromBranch, item.fromSection)}`}
            caption={`To: ${formatClass(item.toYear, item.toSemester, item.toBranch, item.toSection)} | Promoted: ${item.promotedCount}`}
            onPress={() => navigation.navigate('PromotionBatchDetails', { batchId: item.id })}
          />
        )}
      />
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 28 }
});
