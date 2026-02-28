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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { toast } from 'sonner';
import { Plus, Trash, Settings } from 'lucide-react';

export function AccessButton({ positionId, initial = [], onSaved }) {
  const [open, setOpen] = React.useState(false);
  const [screens, setScreens] = React.useState([]); // array of {id,name}
  const [perms, setPerms] = React.useState([]); // array of {id,name}

  const [screen, setScreen] = React.useState(''); // holds selected screen id
  const [permission, setPermission] = React.useState(''); // holds selected perm id
  // normalize initial items to id+name objects
  const [items, setItems] = React.useState(
    initial.map((it) => {
      // it may have screen name or id
      const foundScreen = screens.find(
        (s) => s.name === it.screen || String(s.id) === String(it.screen)
      );
      const foundPerm = perms.find(
        (p) =>
          p.name === it.permission || String(p.id) === String(it.permission)
      );
      return {
        screenId: foundScreen ? foundScreen.id : it.screen,
        screenName: foundScreen ? foundScreen.name : it.screen,
        permissionId: foundPerm ? foundPerm.id : it.permission,
        permissionName: foundPerm ? foundPerm.name : it.permission,
      };
    })
  );

  React.useEffect(() => {
    fetch('/api/screens')
      .then((r) => r.json())
      .then(setScreens)
      .catch(console.error);
    fetch('/api/permissions')
      .then((r) => r.json())
      .then(setPerms)
      .catch(console.error);
  }, []);

  const addItem = () => {
    if (!screen || !permission) return;
    const sc = screens.find((s) => String(s.id) === String(screen));
    const pm = perms.find((p) => String(p.id) === String(permission));
    const scname = sc ? sc.name : screen;
    const pmname = pm ? pm.name : permission;
    // avoid duplicate pair by id or name
    if (
      items.some(
        (it) =>
          (it.screenId === screen && it.permissionId === permission) ||
          (it.screenName === scname && it.permissionName === pmname)
      )
    ) {
      toast.error('Cargo já possui esse acesso');
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        screenId: screen,
        screenName: scname,
        permissionId: permission,
        permissionName: pmname,
      },
    ]);
    setScreen('');
    setPermission('');
  };

  const removeItem = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    try {
      // convert id pairs to names before sending
      const payloadItems = items.map((it) => ({
        screen: it.screenName,
        permission: it.permissionName,
      }));
      const res = await fetch('/api/positions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: positionId, permissions: payloadItems }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Permissões atualizadas');
      if (onSaved) onSaved(items);
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Erro ao salvar permissões');
    }
  };

  return (
    <>
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
          <FieldGroup className="grid grid-cols-[2fr_2fr_auto] gap-2 mb-4 w-full">
            <Field className="w-full">
              <FieldLabel htmlFor="access-screen">Tela</FieldLabel>
              <Select
                id="access-screen"
                value={screen}
                onValueChange={(v) => setScreen(v)}
                className="w-full"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tela" />
                </SelectTrigger>
                <SelectContent>
                  {screens.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field className="w-full">
              <FieldLabel htmlFor="access-permission">Permissão</FieldLabel>
              <Select
                id="access-permission"
                value={permission}
                onValueChange={(v) => setPermission(v)}
                className="w-full"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Permissão" />
                </SelectTrigger>
                <SelectContent>
                  {perms.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="flex items-end">
              <Button
                size="icon"
                variant="outline"
                onClick={addItem}
                className="w-10"
              >
                <Plus />
              </Button>
            </div>
          </FieldGroup>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tela</TableHead>
                <TableHead>Permissão</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it, i) => (
                <TableRow key={i}>
                  <TableCell>{it.screenName || it.screenId}</TableCell>
                  <TableCell>{it.permissionName || it.permissionId}</TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => removeItem(i)}
                    >
                      <Trash />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <DialogFooter>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
