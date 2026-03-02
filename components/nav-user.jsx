'use client';

import * as React from 'react';
import { ChevronsUpDown, LogOut, User } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { SettingsDialog } from '@/components/settings-dialog';
import { useAuth } from '@/hooks/use-auth';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

export function NavUser({ user: initialUser }) {
  const { user: authUser, profile, logout } = useAuth();
  const user = authUser || initialUser;
  const { isMobile } = useSidebar();

  const [logoutLoading, setLogoutLoading] = React.useState(false);
  const handleLogout = async () => {
    setLogoutLoading(true);
    await logout();
  };

  const [settingsOpen, setSettingsOpen] = React.useState(false);

  const initials = React.useMemo(() => {
    // Prioriza dados do profile, depois user_metadata, depois email
    const name =
      profile?.name ||
      user?.user_metadata?.name ||
      user?.email?.split('@')[0] ||
      '';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }, [profile, user]);

  if (!user) return null; // wait until we have user data

  // Prioriza dados do profile
  const displayName =
    profile?.name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Usuário';
  const displayEmail = profile?.email || user?.email || '';
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback className="rounded-lg bg-primary/20 text-primary font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displayName}</span>
                <span className="truncate text-xs">{displayEmail}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="rounded-lg bg-primary/20 text-primary font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="truncate text-xs">{displayEmail}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="flex items-center gap-2 w-full cursor-pointer"
                onClick={() => setSettingsOpen(true)}
              >
                <User />
                Perfil
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="flex items-center gap-2"
                onClick={handleLogout}
              >
                <LogOut />
                Sair
                {logoutLoading && <Spinner className="ml-2" />}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
