'use client';

import * as React from 'react';

import { PageHeader } from '@/components/page-header';
import { PageTable } from '@/components/page-table';
import { PageFilter } from '@/components/page-filter';
import { PositionForm } from '@/components/form/position-form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { AccessButton } from '@/components/buttons/access-button';

// fetch helpers
async function fetchPositions() {
  const res = await fetch('/api/positions');
  return res.json();
}
async function fetchDepartments() {
  const res = await fetch('/api/departments');
  return res.json();
}
async function createPosition(pos) {
  const res = await fetch('/api/positions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pos),
  });
  return res.json();
}
async function updatePosition(pos) {
  const res = await fetch('/api/positions', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pos),
  });
  return res.json();
}
async function deletePosition(id) {
  const res = await fetch(`/api/positions?id=${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Falha ao excluir cargo');
  }
}

export default function PositionsPage() {
  const [positions, setPositions] = React.useState([]);
  const [departments, setDepartments] = React.useState([]);
  const [screens, setScreens] = React.useState([]);
  const [filters, setFilters] = React.useState({});
  const [saveLoading, setSaveLoading] = React.useState(false);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  React.useEffect(() => {
    fetchPositions().then(setPositions);
    fetchDepartments().then(setDepartments);
    fetch('/api/screens')
      .then((r) => r.json())
      .then(setScreens)
      .catch(console.error);
  }, []);

  const deptMap = React.useMemo(
    () => Object.fromEntries(departments.map((d) => [d.id, d.name])),
    [departments]
  );

  const [page, setPage] = React.useState(1);
  const pageSize = 5;

  const handleSave = async (pos) => {
    setSaveLoading(true);
    try {
      // backend accepts number or array; prefer bare number when only one dept
      if (Array.isArray(pos.departments) && pos.departments.length === 1) {
        pos.departments = pos.departments[0];
      }

      if (pos.id) {
        const updated = await updatePosition(pos);
        setPositions((p) => p.map((x) => (x.id === updated.id ? updated : x)));
        toast.success('Cargo atualizado com sucesso');
      } else {
        const created = await createPosition(pos);
        setPositions((p) => [...p, created]);
        toast.success('Cargo criado com sucesso');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Erro ao salvar cargo.');
      throw err;
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (pos) => {
    setDeleteLoading(true);
    try {
      await deletePosition(pos.id);
      setPositions((p) => p.filter((x) => x.id !== pos.id));
      toast.success('Cargo excluído com sucesso');
    } catch (err) {
      toast.error(err.message || 'Não foi possível excluir o cargo.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // filtering
  const filtered = positions.filter((p) => {
    if (
      filters.name &&
      !p.name.toLowerCase().includes(filters.name.toLowerCase())
    )
      return false;
    if (filters.department_id) {
      const depId = Number(filters.department_id);
      const deps = Array.isArray(p.departments)
        ? p.departments
        : [p.departments];
      if (!deps.includes(depId)) return false;
    }
    if (filters.screen) {
      const sel = filters.screen;
      // find selected name if value is id
      const screenName = screens.find(
        (s) => String(s.id) === String(sel)
      )?.name;
      const perms = Array.isArray(p.permissions) ? p.permissions : [];
      if (
        !perms.some((perm) => perm.screen === sel || perm.screen === screenName)
      )
        return false;
    }
    return true;
  });

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  // reset page on filter change
  React.useEffect(() => {
    setPage(1);
  }, [filters]);

  return (
    <div className="space-y-2 p-2">
      <PageHeader
        title="Cargos"
        description="Gerencie os cargos da plataforma"
        routes={[{ title: 'Configuração do Sistema' }, { title: 'Cargos' }]}
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
            key: 'department_id',
            label: 'Departamento',
            component: (props) => (
              <Select {...props} className="w-full">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="-- selecione --" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ),
          },
          {
            key: 'screen',
            label: 'Tela',
            component: (props) => (
              <Select {...props} className="w-full">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="-- selecione --" />
                </SelectTrigger>
                <SelectContent>
                  {screens.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
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
          if (format === 'csv') {
            const csv = filtered.map((p) => `${p.id},${p.name}`).join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'positions.csv';
            a.click();
          }
        }}
      />

      <PageTable
        columns={[
          { key: 'name', label: 'Nome' },
          {
            key: 'departments',
            label: 'Departamentos',
            render: (val) => {
              const list = Array.isArray(val) ? val : [val];
              return list
                .map((id) => deptMap[id])
                .filter(Boolean)
                .join(', ');
            },
          },
          { key: 'created_at', label: 'Criado em', type: 'date' },
          { key: 'updated_at', label: 'Atualizado em', type: 'date' },
        ]}
        data={paged}
        refs={{}}
        onCreate={() => {}}
        onDelete={handleDelete}
        onSave={handleSave}
        formLoading={saveLoading}
        EditForm={(props) => (
          <PositionForm
            {...props}
            departments={departments}
            loading={saveLoading}
          />
        )}
        rowAction={(row) => (
          <AccessButton
            positionId={row.id}
            initial={row.permissions || []}
            onSaved={(items) => {
              // update local state so table refreshes
              setPositions((p) =>
                p.map((x) =>
                  x.id === row.id ? { ...x, permissions: items } : x
                )
              );
            }}
          />
        )}
        pagination={{
          page,
          totalPages: Math.ceil(filtered.length / pageSize) || 1,
          onPageChange: setPage,
        }}
      />
    </div>
  );
}
