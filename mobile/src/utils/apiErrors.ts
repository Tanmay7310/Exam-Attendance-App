export const isSessionExpiredError = (error: any) => {
  const status = error?.response?.status;
  return status === 401 || status === 403;
};

export const getApiErrorMessage = (error: any, fallback: string) => {
  const body = error?.response?.data;
  if (typeof body === 'string' && body.trim().length > 0) {
    return body;
  }
  return body?.message ?? body?.error ?? error?.message ?? fallback;
};

export const handleSessionExpired = async (
  error: any,
  logout: () => Promise<void>,
  showToast: (message: string, options?: any) => void
) => {
  if (!isSessionExpiredError(error)) {
    return false;
  }
  showToast('Session expired. Please login again.', { type: 'error' });
  await logout();
  return true;
};
