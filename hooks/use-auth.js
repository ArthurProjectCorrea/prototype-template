'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import * as auth from '@/lib/auth';

/**
 * Hook para gerenciar autenticação
 * Fornece login, logout e dados do usuário
 */
export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  // Carrega usuário do localStorage na inicialização
  useEffect(() => {
    setUser(auth.getUser());
    setReady(true);
  }, []);

  const handleLogin = useCallback(
    async (email, password) => {
      if (loading) return { success: false, error: 'Login em andamento' };

      setLoading(true);
      const result = await auth.login(email, password);

      if (result.success) {
        setUser(result.user);
        toast.success('Login realizado');
        router.push('/');
      } else {
        toast.error(result.error);
        setLoading(false);
      }

      return result;
    },
    [router, loading]
  );

  const handleLogout = useCallback(() => {
    setLoading(true);
    auth.logout(); // Faz redirect para /login
  }, []);

  return {
    user,
    loading,
    ready,
    isAuthenticated: !!user,
    login: handleLogin,
    logout: handleLogout,
    refresh: () => setUser(auth.getUser()),
  };
}
