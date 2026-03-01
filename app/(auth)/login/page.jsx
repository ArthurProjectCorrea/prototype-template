'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { LoginForm } from '@/components/forms/login-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, ready, loading, login } = useAuth();

  // Redireciona se já estiver logado
  useEffect(() => {
    if (ready && isAuthenticated) {
      router.push('/');
    }
  }, [ready, isAuthenticated, router]);

  const handleSubmit = ({ email, password }) => {
    login(email, password);
  };

  // Aguarda verificar autenticação
  if (!ready || isAuthenticated) {
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
