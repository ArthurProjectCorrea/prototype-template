'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

/**
 * Hook para gerenciar autenticação com Supabase
 * Fornece login, logout e dados do usuário e profile
 */
export function useAuth() {
  const router = useRouter();
  // Memoize o cliente Supabase para evitar criar múltiplas instâncias
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  // Função para buscar o profile do usuário
  const fetchProfile = useCallback(
    async (userId) => {
      if (!userId) {
        setProfile(null);
        return null;
      }

      try {
        const { data, error } = await supabase
          .from('profile')
          .select('*, position:positions(*)')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('[useAuth] Erro ao buscar profile:', error.message);
          return null;
        }

        setProfile(data);
        return data;
      } catch (error) {
        console.error('[useAuth] Erro ao buscar profile:', error);
        return null;
      }
    },
    [supabase]
  );

  // Carrega usuário na inicialização
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        console.log('[useAuth] Iniciando verificação de sessão...');
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.log('[useAuth] Erro ao buscar usuário:', error.message);
        }

        if (isMounted) {
          console.log('[useAuth] Usuário encontrado:', !!user, user?.email);
          setUser(user);

          // Buscar profile se usuário existe
          if (user) {
            await fetchProfile(user.id);
          }

          setReady(true);
        }
      } catch (error) {
        console.error('[useAuth] Erro ao carregar usuário:', error);
        if (isMounted) {
          setReady(true);
        }
      }
    };

    initAuth();

    // Subscribe para mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (isMounted) {
        console.log(
          '[useAuth] Auth state changed:',
          event,
          !!session?.user,
          session?.user?.email
        );
        setUser(session?.user ?? null);

        // Atualizar profile quando autenticação mudar
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  const handleLogin = useCallback(
    async (email, password) => {
      if (loading) return { success: false, error: 'Login em andamento' };

      setLoading(true);
      try {
        // Validar inputs
        if (!email || !password) {
          const msg = 'Email e senha são obrigatórios';
          toast.error(msg);
          setLoading(false);
          return { success: false, error: msg };
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (error) {
          const { handleSupabaseError } = await import('@/lib/error-handler');
          const errorMsg = handleSupabaseError(error, 'auth.signIn');
          toast.error(errorMsg);
          setLoading(false);
          return { success: false, error: errorMsg };
        }

        // Login bem sucedido
        if (data?.session || data?.user) {
          console.log('Login bem sucedido:', data.user?.email);
          toast.success('Login realizado');
          setLoading(false);
          return { success: true };
        }

        // Se caiu aqui sem erro, algo estranho aconteceu
        console.warn('Login retornou sucesso mas sem dados');
        toast.success('Login realizado');
        setLoading(false);
        return { success: true };
      } catch (error) {
        console.error('Login Exception:', error);
        const message = error?.message || 'Erro ao fazer login';
        toast.error(message);
        setLoading(false);
        return { success: false, error: message };
      }
    },
    [router, loading, supabase]
  );

  const handleLogout = useCallback(async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      toast.success('Logout realizado');
      router.push('/login');
    } catch (error) {
      toast.error(error?.message || 'Erro ao fazer logout');
      setLoading(false);
    }
  }, [router, supabase]);

  return {
    user,
    profile,
    loading,
    ready,
    isAuthenticated: !!user,
    login: handleLogin,
    logout: handleLogout,
    refresh: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await fetchProfile(user.id);
      }
    },
    refreshProfile: () => fetchProfile(user?.id),
  };
}
