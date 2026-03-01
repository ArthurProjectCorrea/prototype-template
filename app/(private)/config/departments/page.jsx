'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { PageTable } from '@/components/page-table';
import { PageFilter } from '@/components/page-filter';
import { DepartmentForm } from '@/components/forms/department-form';
import { Input } from '@/components/ui/input';
import { useCrud } from '@/hooks/use-crud';

const SCREEN_KEY = 'departments';

export default function DepartmentsPage() {
  const crud = useCrud({
    endpoint: '/api/departments',
    pageSize: 10,
    messages: {
      createSuccess: 'Departamento criado com sucesso',
      updateSuccess: 'Departamento atualizado com sucesso',
      deleteSuccess: 'Departamento excluído com sucesso',
      createError: 'Erro ao criar departamento',
      updateError: 'Erro ao atualizar departamento',
      deleteError: 'Erro ao excluir departamento',
    },
  });

  return (
    <div className="space-y-2 p-2">
      <PageHeader
        title="Departamentos"
        description="Gerencie os departamentos da organização"
        routes={[
          { title: 'Configuração do Sistema' },
          { title: 'Cadastro de Departamentos' },
        ]}
      />

      <PageFilter
        screenKey={SCREEN_KEY}
        values={crud.filters}
        filters={[
          {
            key: 'name',
            label: 'Nome',
            component: (props) => (
              <Input {...props} placeholder="Buscar por nome..." />
            ),
          },
        ]}
        onSearch={crud.setFilters}
        onClear={crud.clearFilters}
      />

      <PageTable
        screenKey={SCREEN_KEY}
        columns={[
          { key: 'name', label: 'Nome' },
          { key: 'created_at', label: 'Criado em', type: 'date' },
          { key: 'updated_at', label: 'Atualizado em', type: 'date' },
        ]}
        data={crud.pagedData}
        onSave={crud.handleSave}
        onDelete={crud.handleDelete}
        formLoading={crud.loading}
        pagination={crud.pagination}
        EditForm={(props) => (
          <DepartmentForm {...props} loading={crud.loading} />
        )}
      />
    </div>
  );
}
