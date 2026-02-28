import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOutIcon, User } from 'lucide-react';
import { SettingsDialog } from '@/components/settings-dialog';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import Link from 'next/link';

export function AppUser({ user: initialUser }) {
  // keep a local copy so we can update when the stored user changes
  const [u, setU] = React.useState(initialUser || null);
  React.useEffect(() => {
    if (!initialUser) {
      const stored = localStorage.getItem('user');
      if (stored) setU(JSON.parse(stored));
    }
  }, [initialUser]);

  const [logoutLoading, setLogoutLoading] = React.useState(false);
  const logout = () => {
    setLogoutLoading(true);
    localStorage.removeItem('user');
    document.cookie = 'user=; Max-Age=0; path=/';
    toast.success('Logout realizado');
    window.location.href = '/login';
  };

  const [settingsOpen, setSettingsOpen] = React.useState(false);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar>
            <AvatarImage src={u?.avatar} alt={u?.name} />
            <AvatarFallback>
              {u?.name ? u.name.substring(0, 2) : ''}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
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
        <DropdownMenuItem
          className="flex items-center gap-2 w/full cursor-pointer"
          onClick={logout}
        >
          <LogOutIcon />
          <span>Sair</span>
          {logoutLoading && <Spinner className="ml-2" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </DropdownMenu>
  );
}
