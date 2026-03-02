'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import { PositionForm } from '@/components/forms/position-form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { AccessButton } from '@/components/buttons/access-button';
import { useCrud } from '@/hooks/use-crud';

const SCREEN_KEY = 'positions';

export default function PositionsPage() {
  const [screens, setScreens] = React.useState([]);

  // Carregar telas para filtro
  React.useEffect(() => {
    fetch('/api/screens')
      .then((r) => r.json())
      .then(setScreens)
      .catch(console.error);
  }, []);

  const crud = useCrud({
    endpoint: '/api/positions',
    pageSize: 10,
    relations: [
      { key: 'departments', endpoint: '/api/departments', labelKey: 'name' },
    ],
    messages: {
      createSuccess: 'Cargo criado com sucesso',
      updateSuccess: 'Cargo atualizado com sucesso',
      deleteSuccess: 'Cargo excluído com sucesso',
      createError: 'Erro ao criar cargo',
      updateError: 'Erro ao atualizar cargo',
      deleteError: 'Erro ao excluir cargo',
    },
  });

  // Handler para atualizar permissões via AccessButton
  const handlePermissionsSaved = (row, newPermissions) => {
    // Força refresh dos dados
    crud.refresh();
  };

  return (
    <div className="space-y-2 p-2 sm:p-4">
      <PageHeader
        title="Cargos"
        description="Gerencie os cargos e permissões da plataforma"
        routes={[
          { title: 'Configuração do Sistema' },
          { title: 'Cadastro de Cargos' },
        ]}
      />

      <DataTable
        screenKey={SCREEN_KEY}
        columns={[
          { key: 'name', label: 'Nome' },
          {
            key: 'department_id',
            label: 'Departamento',
            render: (val) => {
              return crud.lookupMaps.departments[val] || '-';
            },
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
            key: 'department_id',
            label: 'Departamento',
            component: (props) => (
              <Select {...props} className="w-full">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="-- selecione --" />
                </SelectTrigger>
                <SelectContent>
                  {(crud.relatedData.departments || []).map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ),
          },
        ]}
        data={crud.data}
        loading={crud.initialLoading}
        onSave={crud.handleSave}
        onDelete={crud.handleDelete}
        formLoading={crud.loading}
        EditForm={(props) => (
          <PositionForm
            {...props}
            departments={crud.relatedData.departments || []}
            loading={crud.loading}
          />
        )}
        rowAction={(row, { hasPermission }) =>
          hasPermission('grant') && (
            <AccessButton
              positionId={row.id}
              onSaved={(items) => handlePermissionsSaved(row, items)}
            />
          )
        }
      />
    </div>
  );
}
