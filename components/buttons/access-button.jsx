'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Settings, Search, Loader2 } from 'lucide-react';

export function AccessButton({ positionId, onSaved }) {
  const [open, setOpen] = React.useState(false);
  const [screens, setScreens] = React.useState([]); // array of {id, name, key}
  const [perms, setPerms] = React.useState([]); // array of {id, key, name}
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  // Estado para rastrear permissões marcadas: { [screenKey]: { [permKey]: boolean } }
  const [checkedPerms, setCheckedPerms] = React.useState({});

  // Carrega screens, permissions e access quando o modal abre
  React.useEffect(() => {
    if (!open) return;

    const loadData = async () => {
      setLoading(true);
      try {
        // Carrega telas, permissões e acessos do cargo em paralelo
        const [screensRes, permsRes, accessRes] = await Promise.all([
          fetch('/api/screens'),
          fetch('/api/permissions'),
          fetch(`/api/positions?id=${positionId}&include=access`),
        ]);

        const screensData = await screensRes.json();
        const permsData = await permsRes.json();
        const positionData = await accessRes.json();

        setScreens(screensData);
        setPerms(permsData);

        // Inicializa checkedPerms
        const initialChecked = {};
        screensData.forEach((screen) => {
          initialChecked[screen.key] = {};
          permsData.forEach((perm) => {
            initialChecked[screen.key][perm.key] = false;
          });
        });

        // Marca as permissões que já existem
        const accessList = positionData.access || [];
        accessList.forEach((item) => {
          const screenKey = item.screen?.key;
          const permKey = item.permission?.key;
          if (screenKey && permKey && initialChecked[screenKey]) {
            initialChecked[screenKey][permKey] = true;
          }
        });

        setCheckedPerms(initialChecked);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        toast.error('Erro ao carregar permissões');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [open, positionId]);

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

  // Toggle de uma permissão específica
  const togglePermission = (screenKey, permKey) => {
    setCheckedPerms((prev) => ({
      ...prev,
      [screenKey]: {
        ...prev[screenKey],
        [permKey]: !prev[screenKey]?.[permKey],
      },
    }));
  };

  const handleSave = async () => {
    try {
      // Coleta todas as permissões marcadas
      const payloadItems = [];
      Object.entries(checkedPerms).forEach(([screenKey, permissions]) => {
        Object.entries(permissions).forEach(([permKey, isChecked]) => {
          if (isChecked) {
            payloadItems.push({
              screen_key: screenKey,
              permission_key: permKey,
            });
          }
        });
      });

      const res = await fetch('/api/positions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: positionId, permissions: payloadItems }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Permissões atualizadas');
      if (onSaved) onSaved(payloadItems);
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Erro ao salvar permissões');
    }
  };

  // Conta permissões marcadas para uma tela
  const getCheckedCount = (screenKey) => {
    if (!checkedPerms[screenKey]) return 0;
    return Object.values(checkedPerms[screenKey]).filter(Boolean).length;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Acessos">
          <Settings />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Acessos</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Campo de pesquisa */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar telas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Lista de acordeões */}
            <div className="max-h-80 overflow-y-auto pr-2">
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pl-2">
                        {perms.map((perm) => (
                          <div
                            key={perm.id}
                            className="flex items-center gap-2"
                          >
                            <Checkbox
                              id={`${screen.key}-${perm.key}`}
                              checked={
                                checkedPerms[screen.key]?.[perm.key] || false
                              }
                              onCheckedChange={() =>
                                togglePermission(screen.key, perm.key)
                              }
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

            <DialogFooter>
              <Button onClick={handleSave}>Salvar</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
