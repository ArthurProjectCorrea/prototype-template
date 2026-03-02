'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { LoginForm } from '@/components/forms/login-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, ready, loading, login, user } = useAuth();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const hasRedirected = useRef(false);

  // Log para debugging
  useEffect(() => {
    console.log('[LoginPage] State:', {
      ready,
      isAuthenticated,
      loading,
      user: !!user,
      hasRedirected: hasRedirected.current,
    });
  }, [ready, isAuthenticated, loading, user]);

  // Redireciona se já estiver logado (apenas uma vez e somente após ready)
  useEffect(() => {
    // Evita redirects múltiplos
    if (hasRedirected.current) return;

    // Só redireciona quando ready === true E user está realmente autenticado
    // E aguarda 500ms para garantir que o estado estabilizou
    if (ready && isAuthenticated && !loading) {
      console.log('[LoginPage] User is authenticated, will redirect...');
      setShouldRedirect(true);
    }
  }, [ready, isAuthenticated, loading]);

  // Executa o redirect após delay para evitar race conditions
  useEffect(() => {
    if (!shouldRedirect || hasRedirected.current) return;

    const timer = setTimeout(() => {
      if (hasRedirected.current) return;
      hasRedirected.current = true;
      console.log('[LoginPage] Redirecting now...');
      const redirect = searchParams.get('redirect');
      router.push(redirect || '/');
    }, 100);

    return () => clearTimeout(timer);
  }, [shouldRedirect, searchParams, router]);

  const handleSubmit = async ({ email, password }) => {
    const result = await login(email, password);
    if (result.success) {
      // Login bem sucedido - o onAuthStateChange vai atualizar o estado
      // e o useEffect acima vai fazer o redirect
      console.log('[LoginPage] Login success, waiting for auth state change');
    }
  };

  // Aguarda verificar autenticação
  if (!ready) {
    console.log('[LoginPage] Waiting for auth to be ready...');
    return null;
  }

  // Se já está autenticado ou vai redirecionar, não mostra o form
  if (isAuthenticated || shouldRedirect) {
    console.log('[LoginPage] Already authenticated or redirecting...');
    return null;
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle>Faça login na sua conta</CardTitle>
            <CardDescription>
              Insira seu e-mail abaixo para acessar sua conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm onSubmit={handleSubmit} loading={loading} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
