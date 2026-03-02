import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/app-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppLoading } from '@/components/app-loading';

export default async function PrivateLayout({ children }) {
  // Autenticação é gerenciada pelo middleware (proxy.js)
  // Não precisa de verificação aqui - o middleware já redireciona para /login se necessário

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
