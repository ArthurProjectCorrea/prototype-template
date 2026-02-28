import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/app-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppLoading } from '@/components/app-loading';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function PrivateLayout({ children }) {
  // server-side guard: if no user cookie, redirect to login.
  // wrap in checks in case this code ever runs on the client (which can
  // happen during hydration) since `cookies()` may return an object that
  // doesn't expose `get` there.
  if (typeof window === 'undefined') {
    const cookieStore = await cookies();
    const userCookie =
      cookieStore && typeof cookieStore.get === 'function'
        ? cookieStore.get('user')
        : null;
    if (!userCookie) {
      redirect('/login');
    }
  }

  return (
    <div className="[--header-height:calc(--spacing(14))]">
      <SidebarProvider className="flex flex-col">
        <SiteHeader />
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset>
            <div className="relative flex-1">
              <AppLoading />
              {children}
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
