'use client';

import * as React from 'react';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';

export function SiteHeader() {
  const { user } = useAuth();

  // Extrai nome do usuário do objeto Supabase
  const userName =
    user?.user_metadata?.name || user?.email?.split('@')[0] || 'Visitante';

  return (
    <header className="bg-gradient-to-r from-primary-foreground to-primary sticky top-0 z-50 flex w-full items-center justify-between border-b">
      <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1 text-muted-foreground" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex">
          <Image
            className="h-12 w-auto transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:rotate-[35deg] active:scale-125 active:rotate-[35deg] active:duration-100"
            src="/logo-dainai.svg"
            alt="Dainai logo"
            width={20}
            height={20}
            priority
          />
        </div>
      </div>
      <div className="p-2 flex items-center justify-end gap-2 w-xs text-primary-foreground">
        <p className="font-medium">Olá, {userName}</p>
      </div>
    </header>
  );
}
