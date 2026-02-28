'use client';

import * as React from 'react';
import {
  Bell,
  Check,
  Globe,
  Home,
  Keyboard,
  Link,
  Lock,
  Menu,
  MessageCircle,
  Paintbrush,
  Settings,
  Video,
  SlidersHorizontal,
} from 'lucide-react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { ProfileForm } from '@/components/form/profile-form';
import { ConfigForm } from '@/components/form/config-form';
import { PermissionsSection } from '@/components/permissions-section';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar';

const data = {
  nav: [
    { name: 'Geral', icon: Settings },
    { name: 'Configurações', icon: SlidersHorizontal },
    { name: 'Permissões', icon: Check },
  ],
};

export function SettingsDialog({ open: openProp, onOpenChange }) {
  const [open, setOpen] = React.useState(openProp ?? false);
  const [active, setActive] = React.useState(data.nav[0].name);

  React.useEffect(() => {
    if (openProp !== undefined) setOpen(openProp);
  }, [openProp]);

  const handleOpenChange = (val) => {
    setOpen(val);
    if (onOpenChange) onOpenChange(val);
  };

  // simple components for each section
  const GeneralContent = () => (
    <div className="p-4">
      <ProfileForm />
    </div>
  );
  const ConfigContent = () => (
    <div className="p-4">
      <ConfigForm />
    </div>
  );
  const PermissionsContent = () => (
    <div className="p-4">
      <PermissionsSection />
    </div>
  );

  const renderContent = () => {
    switch (active) {
      case 'Configurações':
        return <ConfigContent />;
      case 'Permissões':
        return <PermissionsContent />;
      case 'Geral':
      default:
        return <GeneralContent />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="overflow-hidden p-0 md:max-h-[500px] lg:max-w-[800px]">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <DialogDescription className="sr-only">
          Customize your settings here.
        </DialogDescription>
        <SidebarProvider className="items-start">
          <Sidebar collapsible="none" className="hidden md:flex">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {data.nav.map((item) => (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          asChild
                          isActive={item.name === active}
                          onClick={() => setActive(item.name)}
                        >
                          <a href="#" onClick={(e) => e.preventDefault()}>
                            <item.icon />
                            <span>{item.name}</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <main className="flex h-[480px] flex-1 flex-col overflow-hidden">
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
                <h1 className="text-lg font-semibold">{active}</h1>
              </div>
            </header>
            <div className="flex flex-1 flex-col overflow-y-auto">
              {renderContent()}
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  );
}
