import { AppSidebar } from '../../components/app-sidebar';
import { SiteHeader } from '../../components/app-header';
import { SidebarInset, SidebarProvider } from '../../components/ui/sidebar';

export default function PrivateLayout({ children }) {
  return (
    <div className="[--header-height:calc(--spacing(14))]">
      <SidebarProvider className="flex flex-col">
        <SiteHeader />
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset>{children}</SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
