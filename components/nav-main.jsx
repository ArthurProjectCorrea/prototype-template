'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { useMemo } from 'react';
import { usePermission } from '@/hooks/use-permission';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';

export function NavMain({ items }) {
  const pathname = usePathname();
  const { canView } = usePermission();

  /**
   * Verifica se um item de menu deve ser visível
   */
  const isItemVisible = (item) => {
    // Se não precisa verificar permissão, sempre visível
    if (!item.verify_permission) return true;
    // Verifica se tem permissão view para a key
    return canView(item.key);
  };

  // Filtra items baseado em permissões
  const filteredItems = useMemo(() => {
    return items
      .map((item) => {
        // Se tem subitens, filtra os subitens
        if (item.items?.length) {
          const visibleSubItems = item.items.filter((subItem) =>
            isItemVisible(subItem)
          );
          // Se nenhum subitem visível, oculta o grupo
          if (visibleSubItems.length === 0) return null;
          return { ...item, items: visibleSubItems };
        }
        // Item simples - verifica permissão
        if (!isItemVisible(item)) return null;
        return item;
      })
      .filter(Boolean);
  }, [items, canView]);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Plataforma</SidebarGroupLabel>
      <SidebarMenu>
        {filteredItems.map((item) => {
          const isActive =
            item.isActive !== undefined ? item.isActive : pathname === item.url;

          return (
            <Collapsible key={item.title} asChild defaultOpen={isActive}>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={item.title}>
                  {item.url ? (
                    <Link href={item.url} className="flex items-center">
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  ) : (
                    <div className="flex items-center">
                      <item.icon />
                      <span>{item.title}</span>
                    </div>
                  )}
                </SidebarMenuButton>
                {item.items?.length ? (
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuAction className="data-[state=open]:rotate-90">
                        <ChevronRight />
                        <span className="sr-only">Toggle</span>
                      </SidebarMenuAction>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((subItem) => {
                          const subActive =
                            subItem.isActive !== undefined
                              ? subItem.isActive
                              : pathname === subItem.url;

                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild>
                                {subItem.url ? (
                                  <Link
                                    href={subItem.url}
                                    className="block w-full"
                                  >
                                    <span>{subItem.title}</span>
                                  </Link>
                                ) : (
                                  <div className="block w-full">
                                    <span>{subItem.title}</span>
                                  </div>
                                )}
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                ) : null}
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
