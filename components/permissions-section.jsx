'use client';

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { createClient } from '@/lib/supabase/client';
import { Search } from 'lucide-react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function PermissionsSection() {
  const { user: authUser } = useAuth();
  const [screens, setScreens] = React.useState([]);
  const [perms, setPerms] = React.useState([]);
  const [search, setSearch] = React.useState('');

  // Estado para rastrear permissões do usuário: { [screenKey]: { [permKey]: boolean } }
  const [userPermissions, setUserPermissions] = React.useState({});

  React.useEffect(() => {
    if (!authUser?.id) return;

    const supabase = createClient();

    const loadData = async () => {
      try {
        // Carrega telas e permissões
        const [screensRes, permsRes] = await Promise.all([
          supabase.from('screens').select('id, key, name'),
          supabase.from('permissions').select('id, key, name'),
        ]);

        const screensData = screensRes.data || [];
        const permsData = permsRes.data || [];
        setScreens(screensData);
        setPerms(permsData);

        // Busca posição do usuário
        const { data: profile } = await supabase
          .from('profile')
          .select('position_id')
          .eq('id', authUser.id)
          .single();

        if (profile?.position_id) {
          // Busca acessos do cargo
          const { data: accessData } = await supabase
            .from('access')
            .select('screen:screen_id(key), permission:permission_id(key)')
            .eq('position_id', profile.position_id);

          // Inicializa userPermissions
          const initialPerms = {};
          screensData.forEach((screen) => {
            initialPerms[screen.key] = {};
            permsData.forEach((perm) => {
              initialPerms[screen.key][perm.key] = false;
            });
          });

          // Marca as permissões que o usuário tem
          (accessData || []).forEach((item) => {
            const screenKey = item.screen?.key;
            const permKey = item.permission?.key;
            if (screenKey && permKey && initialPerms[screenKey]) {
              initialPerms[screenKey][permKey] = true;
            }
          });

          setUserPermissions(initialPerms);
        }
      } catch (error) {
        console.error('Error loading permissions:', error);
      }
    };

    loadData();
  }, [authUser]);

  // Filtra telas baseado na pesquisa
  const filteredScreens = React.useMemo(() => {
    if (!search.trim()) return screens;
    const searchLower = search.toLowerCase();
    return screens.filter(
      (screen) =>
        screen.name.toLowerCase().includes(searchLower) ||
        screen.key.toLowerCase().includes(searchLower)
    );
  }, [screens, search]);

  // Conta permissões para uma tela
  const getCheckedCount = (screenKey) => {
    if (!userPermissions[screenKey]) return 0;
    return Object.values(userPermissions[screenKey]).filter(Boolean).length;
  };

  if (!authUser) return null;

  return (
    <div className="p-4 space-y-4">
      {/* Campo de pesquisa */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar telas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Lista de acordeões */}
      <div className="max-h-96 overflow-y-auto pr-2">
        <Accordion type="single" collapsible className="w-full">
          {filteredScreens.map((screen) => (
            <AccordionItem key={screen.id} value={screen.key}>
              <AccordionTrigger className="text-sm">
                <div className="flex items-center gap-2">
                  <span>{screen.name}</span>
                  {getCheckedCount(screen.key) > 0 && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                      {getCheckedCount(screen.key)}
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-3 gap-3 pl-2">
                  {perms.map((perm) => (
                    <div key={perm.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`${screen.key}-${perm.key}`}
                        checked={
                          userPermissions[screen.key]?.[perm.key] || false
                        }
                        disabled
                      />
                      <Label
                        htmlFor={`${screen.key}-${perm.key}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {perm.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {filteredScreens.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma tela encontrada
          </p>
        )}
      </div>
    </div>
  );
}
