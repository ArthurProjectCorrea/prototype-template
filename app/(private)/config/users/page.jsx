'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { PageTable } from '@/components/page-table';
import { PageFilter } from '@/components/page-filter';
import { UserForm } from '@/components/forms/user-form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { useCrud } from '@/hooks/use-crud';

const SCREEN_KEY = 'users';

export default function UsersPage() {
  const crud = useCrud({
    endpoint: '/api/users',
    pageSize: 10,
    relations: [
      { key: 'positions', endpoint: '/api/positions', labelKey: 'name' },
    ],
    messages: {
      createSuccess: 'Usuário criado com sucesso',
      updateSuccess: 'Usuário atualizado com sucesso',
      deleteSuccess: 'Usuário excluído com sucesso',
      createError: 'Erro ao criar usuário',
      updateError: 'Erro ao atualizar usuário',
      deleteError: 'Erro ao excluir usuário',
    },
  });

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
          {
            key: 'email',
            label: 'Email',
            component: (props) => (
              <Input {...props} placeholder="Buscar por email..." />
            ),
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
                  {(crud.relatedData.positions || []).map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          { key: 'email', label: 'Email' },
          {
            key: 'position_id',
            label: 'Cargo',
            render: (val) => crud.lookupMaps.positions[val] || '-',
          },
          { key: 'created_at', label: 'Criado em', type: 'date' },
          { key: 'updated_at', label: 'Atualizado em', type: 'date' },
        ]}
        data={crud.pagedData}
        refs={{ position_id: crud.lookupMaps.positions }}
        onSave={crud.handleSave}
        onDelete={crud.handleDelete}
        formLoading={crud.loading}
        pagination={crud.pagination}
        EditForm={(props) => (
          <UserForm
            {...props}
            positions={crud.relatedData.positions || []}
            loading={crud.loading}
          />
        )}
      />
    </div>
  );
}
