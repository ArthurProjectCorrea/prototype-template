'use client';

import * as React from 'react';

import { PageHeader } from '@/components/page-header';
import { PageTable } from '@/components/page-table';
import { PageFilter } from '@/components/page-filter';
import { UserForm } from '@/components/form/user-form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { toast } from 'sonner';

// fetch-based helpers for server-backed JSON
async function fetchUsers() {
  const res = await fetch('/api/users');
  return res.json();
}
async function fetchPositions() {
  const res = await fetch('/api/positions');
  return res.json();
}
async function createUser(user) {
  const res = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  return res.json();
}
async function updateUser(user) {
  const res = await fetch('/api/users', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  return res.json();
}
async function deleteUser(id) {
  const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Falha ao excluir usuário');
  }
}

export default function UsersPage() {
  const [users, setUsers] = React.useState([]);
  const [positions, setPositions] = React.useState([]);
  const [filters, setFilters] = React.useState({});

  const positionMap = React.useMemo(
    () => Object.fromEntries(positions.map((p) => [p.id, p.name])),
    [positions]
  );
  const [page, setPage] = React.useState(1);
  const pageSize = 5; // adjust as needed

  React.useEffect(() => {
    fetchUsers().then(setUsers);
    fetchPositions().then(setPositions);
  }, []);

  const [saveLoading, setSaveLoading] = React.useState(false);

  const handleSave = async (user) => {
    setSaveLoading(true);
    try {
      if (user.id) {
        const updated = await updateUser(user);
        setUsers((u) => u.map((x) => (x.id === updated.id ? updated : x)));
        toast.success('Usuário atualizado com sucesso');
      } else {
        const created = await createUser(user);
        setUsers((u) => [...u, created]);
        // server may generate a password for us
        if (created.password) {
          toast.success(
            `Usuário criado com sucesso. Senha: ${created.password}`
          );
        } else {
          toast.success('Usuário criado com sucesso');
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Erro ao salvar usuário.');
      throw err;
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (user) => {
    try {
      await deleteUser(user.id);
      setUsers((u) => u.filter((x) => x.id !== user.id));
      toast.success('Usuário excluído com sucesso');
    } catch (err) {
      toast.error(err.message || 'Não foi possível excluir o usuário.');
    }
  };

  const handleCreate = () => {
    // optional: any external state before dialog open
  };

  // apply filters before pagination
  const filteredUsers = users.filter((u) => {
    if (
      filters.name &&
      !u.name.toLowerCase().includes(filters.name.toLowerCase())
    )
      return false;
    if (
      filters.email &&
      !u.email.toLowerCase().includes(filters.email.toLowerCase())
    )
      return false;
    if (
      filters.position_id &&
      String(u.position_id) !== String(filters.position_id)
    )
      return false;
    return true;
  });

  const pagedUsers = filteredUsers.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // whenever filters change we should go back to first page
  React.useEffect(() => {
    setPage(1);
  }, [filters]);

  return (
    <div className="space-y-2 p-2">
      <PageHeader
        title="Cadastro de Usuários"
        description="Gerencie os acessos da plataforma"
        routes={[
          { title: 'Configuração do Sistema' },
          { title: 'Cadastro de Usuários' },
        ]}
      />

      <PageFilter
        values={filters}
        filters={[
          {
            key: 'name',
            label: 'Nome',
            component: (props) => <Input {...props} />,
          },
          {
            key: 'email',
            label: 'Email',
            component: (props) => <Input {...props} />,
          },
          {
            key: 'position_id',
            label: 'Cargo',
            component: (props) => (
              <Select {...props} className="w-full">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="-- selecione --" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ),
          },
        ]}
        onSearch={setFilters}
        onClear={() => setFilters({})}
        showExport={false}
        onExport={(format) => {
          // simple exporter switch, CSV implemented; PDF could be added later
          if (format === 'csv') {
            const csv = filteredUsers
              .map((u) => `${u.id},${u.name},${u.email}`)
              .join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'users.csv';
            a.click();
            URL.revokeObjectURL(url);
          } else if (format === 'pdf') {
            // stub PDF export - same data for now
            const csv = filteredUsers
              .map((u) => `${u.id},${u.name},${u.email}`)
              .join('\n');
            const blob = new Blob([csv], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'users.pdf';
            a.click();
            URL.revokeObjectURL(url);
          }
        }}
      />
      <PageTable
        columns={[
          { key: 'name', label: 'Nome' },
          { key: 'email', label: 'Email' },
          {
            key: 'position_id',
            label: 'Cargo',
            render: (val) => positionMap[val] || '',
          },
          { key: 'created_at', label: 'Criado em', type: 'date' },
          { key: 'updated_at', label: 'Atualizado em', type: 'date' },
        ]}
        data={pagedUsers}
        refs={{ position_id: positionMap }}
        onCreate={handleCreate}
        onDelete={handleDelete}
        onSave={handleSave}
        formLoading={saveLoading}
        EditForm={(props) => (
          <UserForm {...props} positions={positions} loading={saveLoading} />
        )}
        pagination={{
          page,
          totalPages: Math.ceil(filteredUsers.length / pageSize) || 1,
          onPageChange: setPage,
        }}
      />
    </div>
  );
}
