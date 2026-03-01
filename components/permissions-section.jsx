'use client';

import * as React from 'react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';

export function PermissionsSection() {
  const [user, setUser] = React.useState(null);
  const [permissions, setPermissions] = React.useState([]);
  const [screens, setScreens] = React.useState([]);

  React.useEffect(() => {
    fetch('/api/screens')
      .then((r) => r.json())
      .then(setScreens)
      .catch(console.error);
  }, []);

  React.useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      if (u.position_id) {
        fetch('/api/positions')
          .then((r) => r.json())
          .then((positions) => {
            const pos = positions.find((p) => p.id === u.position_id);
            if (pos && pos.permissions) {
              setPermissions(pos.permissions);
            }
          })
          .catch(console.error);
      }
    }
  }, []);

  // Busca nome da tela pelo key
  const getScreenName = (screenKey) => {
    const screen = screens.find((s) => s.key === screenKey);
    return screen?.name || screenKey;
  };

  if (!user) return null;

  return (
    <div className="p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tela</TableHead>
            <TableHead>Permissão</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {permissions.map((perm, i) => (
            <TableRow key={i}>
              <TableCell>{getScreenName(perm.screen_key)}</TableCell>
              <TableCell>{perm.permission_key}</TableCell>
            </TableRow>
          ))}
          {permissions.length === 0 && (
            <TableRow>
              <TableCell colSpan={2} className="text-center py-4">
                Nenhuma permissão encontrada.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
