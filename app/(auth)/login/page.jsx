import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LoginScreen } from '@/components/login-screen';

export default async function Page() {
  // redirect if already signed in (server)
  const cookieStore = await cookies();
  if (cookieStore && typeof cookieStore.get === 'function') {
    if (cookieStore.get('user')) {
      redirect('/');
    }
  }

  return <LoginScreen />;
}
