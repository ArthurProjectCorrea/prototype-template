'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import { UserForm } from '@/components/forms/user-form';
import { EmailVerificationBadge } from '@/components/email-verification-badge';
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
      { key: 'departments', endpoint: '/api/departments', labelKey: 'name' },
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

  // Handle save with custom logic for email changes
  const handleSave = React.useCallback(
    async (item) => {
      const originalEmail = crud.data.find((u) => u.id === item.id)?.email;
      const result = await crud.handleSave(item);

      // Se é atualização e o email mudou, mostrar toast de confirmação
      if (
        item.id &&
        originalEmail &&
        item.email &&
        originalEmail !== item.email
      ) {
        toast.info('Email de confirmação foi enviado para o novo endereço');
      }

      return result;
    },
    [crud]
  );

  return (
    <div className="space-y-2 p-2 sm:p-4">
      <PageHeader
        title="Cadastro de Usuários"
        description="Gerencie os acessos da plataforma"
        routes={[
          { title: 'Configuração do Sistema' },
          { title: 'Cadastro de Usuários' },
        ]}
      />

      <DataTable
        screenKey={SCREEN_KEY}
        columns={[
          { key: 'name', label: 'Nome' },
          { key: 'email', label: 'Email' },
          {
            key: 'confirmed_at',
            label: 'Verificação',
            render: (val) => <EmailVerificationBadge confirmedAt={val} />,
            hideOnMobile: true,
          },
          {
            key: 'position_id',
            label: 'Cargo',
            render: (val) => crud.lookupMaps.positions[val] || '-',
          },
          {
            key: 'created_at',
            label: 'Criado em',
            type: 'date',
            hideOnMobile: true,
          },
          {
            key: 'updated_at',
            label: 'Atualizado em',
            type: 'date',
            hideOnMobile: true,
          },
        ]}
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
        data={crud.data}
        loading={crud.initialLoading}
        refs={{ position_id: crud.lookupMaps.positions }}
        onSave={handleSave}
        onDelete={crud.handleDelete}
        formLoading={crud.loading}
        EditForm={(props) => (
          <UserForm
            {...props}
            positions={crud.relatedData.positions || []}
            departments={crud.relatedData.departments || []}
            loading={crud.loading}
          />
        )}
      />
    </div>
  );
}
