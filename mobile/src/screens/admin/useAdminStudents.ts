import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { StudentItem } from '../../types';
import { getApiErrorMessage, handleSessionExpired } from '../../utils/apiErrors';

export const useAdminStudents = () => {
  const { logout } = useAuth();
  const { showToast } = useToast();
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [diagnostics, setDiagnostics] = useState('');
  const [loading, setLoading] = useState(false);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<StudentItem[]>('/api/admin/students');
      setStudents(Array.isArray(data) ? data : []);
      setDiagnostics('');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLoadError = useCallback(async (e: any) => {
    if (await handleSessionExpired(e, logout, showToast)) return;
    setDiagnostics(`Load students failed (${e?.response?.status ?? 'network'}): ${e?.message ?? 'Unknown error'}`);
    showToast(getApiErrorMessage(e, 'Failed to load students'), { type: 'error' });
  }, [logout, showToast]);

  useFocusEffect(
    useCallback(() => {
      loadStudents().catch(handleLoadError);
    }, [handleLoadError, loadStudents])
  );

  return { students, diagnostics, loading, loadStudents };
};
