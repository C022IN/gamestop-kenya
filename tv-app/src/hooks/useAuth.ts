import { useState, useEffect, useCallback } from 'react';
import { clearToken, getStoredToken, login as apiLogin } from '@/api/client';

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getStoredToken().then(t => setIsLoggedIn(!!t));
  }, []);

  const login = useCallback(async (phone: string, accessCode: string) => {
    setLoading(true);
    setError(null);
    const result = await apiLogin(phone, accessCode);
    setLoading(false);
    if (result.ok) {
      setIsLoggedIn(true);
    } else {
      setError(result.error ?? 'Login failed');
    }
    return result.ok;
  }, []);

  const logout = useCallback(async () => {
    await clearToken();
    setIsLoggedIn(false);
  }, []);

  return { isLoggedIn, loading, error, login, logout };
}
