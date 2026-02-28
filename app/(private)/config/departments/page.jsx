'use client';

import * as React from 'react';

import { PageHeader } from '@/components/page-header';
import { PageTable } from '@/components/page-table';
import { PageFilter } from '@/components/page-filter';
import { DepartmentForm } from '@/components/form/department-form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

async function fetchDepartments() {
  const res = await fetch('/api/departments');
  return res.json();
}
async function createDepartment(dep) {
  const res = await fetch('/api/departments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dep),
  });
  return res.json();
}
async function updateDepartment(dep) {
  const res = await fetch('/api/departments', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dep),
  });
  return res.json();
}
async function deleteDepartment(id) {
  const res = await fetch(`/api/departments?id=${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Falha ao excluir departamento');
  }
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = React.useState([]);
  const [filters, setFilters] = React.useState({});
  const [page, setPage] = React.useState(1);
  const [saveLoading, setSaveLoading] = React.useState(false);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const pageSize = 5;

  React.useEffect(() => {
    fetchDepartments().then(setDepartments);
  }, []);

  const handleSave = async (dep) => {
    setSaveLoading(true);
    try {
      if (dep.id) {
        const updated = await updateDepartment(dep);
        setDepartments((d) =>
          d.map((x) => (x.id === updated.id ? updated : x))
        );
        toast.success('Departamento atualizado com sucesso');
      } else {
        const created = await createDepartment(dep);
        setDepartments((d) => [...d, created]);
        toast.success('Departamento criado com sucesso');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Erro ao salvar departamento.');
      throw err;
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (dep) => {
    setDeleteLoading(true);
    try {
      await deleteDepartment(dep.id);
      setDepartments((d) => d.filter((x) => x.id !== dep.id));
      toast.success('Departamento excluído com sucesso');
    } catch (err) {
      toast.error(err.message || 'Não foi possível excluir o departamento.');
      // handled locally; page-table will show the inline message
    } finally {
      setDeleteLoading(false);
    }
  };

  const filtered = departments.filter((d) => {
    if (
      filters.name &&
      !d.name.toLowerCase().includes(filters.name.toLowerCase())
    )
      return false;
    return true;
  });

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  React.useEffect(() => {
    setPage(1);
  }, [filters]);

  return (
    <div className="space-y-2 p-2">
      <PageHeader
        title="Departamentos"
        description="Gerencie os departamentos da organização"
        routes={[
          { title: 'Configuração do Sistema' },
          { title: 'Departamentos' },
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
        ]}
        onSearch={setFilters}
        onClear={() => setFilters({})}
        showExport={false}
        onExport={(format) => {
          if (format === 'csv') {
            const csv = filtered.map((d) => `${d.id},${d.name}`).join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'departments.csv';
            a.click();
          }
        }}
      />

      <PageTable
        columns={[
          { key: 'name', label: 'Nome' },
          { key: 'created_at', label: 'Criado em', type: 'date' },
          { key: 'updated_at', label: 'Atualizado em', type: 'date' },
        ]}
        data={paged}
        onDelete={handleDelete}
        onSave={handleSave}
        formLoading={saveLoading}
        EditForm={(props) => (
          <DepartmentForm {...props} loading={saveLoading} />
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
