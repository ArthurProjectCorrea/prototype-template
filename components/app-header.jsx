'use client';

import * as React from 'react';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import Image from 'next/image';

// header will load the authenticated user from storage
// fallback text is handled in render

export function SiteHeader() {
  const [currentUser, setCurrentUser] = React.useState(null);

  React.useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      setCurrentUser(JSON.parse(stored));
    }
  }, []);

  return (
    <header className="bg-background sticky top-0 z-50 flex w-full items-center justify-between border-b">
      <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex">
          <Image
            className="h-12 w-auto transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:rotate-[35deg] active:scale-125 active:rotate-[35deg] active:duration-100"
            src="/logo-dainai.svg"
            alt="Dainai logo"
            width={100}
            height={20}
            priority
          />
        </div>
      </div>
      <div className="p-2 flex items-center justify-end gap-2 w-xs">
        <p className="font-medium text-muted-foreground">
          Ola, {currentUser?.name || 'Visitante'}
        </p>
      </div>
    </header>
  );
}
