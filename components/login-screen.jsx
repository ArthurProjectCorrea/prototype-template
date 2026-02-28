'use client';

import * as React from 'react';
import { LoginForm } from '@/components/form/login-form';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const handleLogin = async ({ email, password }) => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const users = await res.json();
      const user = users.find(
        (u) => u.email === email && u.password === password
      );
      if (!user) {
        toast.error('E-mail ou senha inválidos');
        setLoading(false);
        return;
      }
      // store in localStorage and cookie
      const str = JSON.stringify(user);
      localStorage.setItem('user', str);
      document.cookie = `user=${encodeURIComponent(str)}; path=/`;
      toast.success('Login realizado');
      router.push('/');
    } catch (err) {
      console.error(err);
      toast.error('Erro durante login');
      setLoading(false);
    }
  };

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
            <LoginForm onSubmit={handleLogin} loading={loading} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
