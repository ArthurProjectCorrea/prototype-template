'use client';

import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { AppUser } from '@/components/app-user';
import Image from 'next/image';

const data = {
  user: {
    name: 'shadcn Acme',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
};

export function SiteHeader() {
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
        <p className="font-medium">Ola, {data.user.name}</p>
        <AppUser user={data.user} />
      </div>
    </header>
  );
}
