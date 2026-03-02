'use client';

import * as React from 'react';
import {
  Command,
  GitPullRequestArrow,
  LifeBuoy,
  Send,
  SquareTerminal,
  LayoutDashboard,
  FilePen,
  Goal,
  Landmark,
} from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { createClient } from '@/lib/supabase/client';
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
      isActive: false,
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
  const { user: authUser } = useAuth();
  const supabase = React.useMemo(() => createClient(), []);

  const [positionName, setPositionName] = React.useState('');

  React.useEffect(() => {
    if (!authUser?.id) {
      setPositionName('Usuário');
      return;
    }

    const loadPositionName = async () => {
      try {
        // Fetch user profile to get position_id
        const { data: profile } = await supabase
          .from('profile')
          .select('position_id')
          .eq('id', authUser.id)
          .single();

        if (profile?.position_id) {
          // Fetch position to get name
          const { data: position } = await supabase
            .from('positions')
            .select('name')
            .eq('id', profile.position_id)
            .single();

          if (position?.name) {
            setPositionName(position.name);
          }
        }
      } catch (error) {
        console.error('Error loading position:', error);
        setPositionName('Usuário');
      }
    };

    loadPositionName();
  }, [authUser, supabase]);

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
                <Landmark className="size-4" />
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
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
