'use client';

import * as React from 'react';
import {
  Command,
  GitPullRequestArrow,
  LifeBuoy,
  Send,
  SquareTerminal,
  LayoutDashboard,
} from 'lucide-react';

import { NavMain } from '@/components/nav-main';
import { NavSecondary } from '@/components/nav-secondary';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import Link from 'next/link';

const data = {
  navMain: [
    {
      title: 'Dashboard',
      url: '/',
      verify_permission: false,
      key: 'dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Configurações',
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: 'Usuários',
          url: '/config/users',
          verify_permission: true,
          key: 'users',
        },
        {
          title: 'Cargos',
          url: '/config/positions',
          verify_permission: true,
          key: 'positions',
        },
        {
          title: 'Departamentos',
          url: '/config/departments',
          verify_permission: true,
          key: 'departments',
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: 'Support',
      url: '#',
      icon: LifeBuoy,
    },
    {
      title: 'Feedback',
      url: '#',
      icon: Send,
    },
    {
      title: `Version ${process.env.NEXT_PUBLIC_APP_VERSION}`,
      url: '#',
      icon: GitPullRequestArrow,
    },
  ],
};

export function AppSidebar({ ...props }) {
  const [currentUser, setCurrentUser] = React.useState(null);
  const [positions, setPositions] = React.useState([]);

  React.useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setCurrentUser(JSON.parse(stored));

    fetch('/api/positions')
      .then((r) => r.json())
      .then(setPositions)
      .catch(console.error);
  }, []);

  const positionName =
    positions.find((p) => p.id === currentUser?.position_id)?.name || '';

  return (
    <Sidebar
      collapsible="icon"
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarHeader className="mt-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg ">
                <Command className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Dainai Corp</span>
                <span className="truncate text-xs">
                  {positionName || 'Usuário'}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={currentUser} />
      </SidebarFooter>
    </Sidebar>
  );
}
