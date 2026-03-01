'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { PageTable } from '@/components/page-table';
import { PageFilter } from '@/components/page-filter';
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

  // Filtro customizado para lidar com departments (array) e permissions
  const customFilter = React.useCallback(
    (item, filters) => {
      // Filtro por nome
      if (
        filters.name &&
        !item.name.toLowerCase().includes(filters.name.toLowerCase())
      ) {
        return false;
      }

      // Filtro por departamento
      if (filters.department_id) {
        const depId = Number(filters.department_id);
        const deps = Array.isArray(item.departments)
          ? item.departments
          : [item.departments];
        if (!deps.includes(depId)) return false;
      }

      // Filtro por tela (permissões) - usando screen_key
      if (filters.screen) {
        const screenKey = screens.find(
          (s) => String(s.id) === String(filters.screen)
        )?.key;
        const perms = Array.isArray(item.permissions) ? item.permissions : [];
        if (!perms.some((perm) => perm.screen_key === screenKey)) {
          return false;
        }
      }

      return true;
    },
    [screens]
  );

  const crud = useCrud({
    endpoint: '/api/positions',
    pageSize: 10,
    relations: [
      { key: 'departments', endpoint: '/api/departments', labelKey: 'name' },
    ],
    filterFn: customFilter,
    messages: {
      createSuccess: 'Cargo criado com sucesso',
      updateSuccess: 'Cargo atualizado com sucesso',
      deleteSuccess: 'Cargo excluído com sucesso',
      createError: 'Erro ao criar cargo',
      updateError: 'Erro ao atualizar cargo',
      deleteError: 'Erro ao excluir cargo',
    },
  });

  // Handler customizado para salvar (normaliza departments)
  const handleSave = async (pos) => {
    // Backend aceita number ou array; prefere number quando só tem um
    if (Array.isArray(pos.departments) && pos.departments.length === 1) {
      pos.departments = pos.departments[0];
    }
    return crud.handleSave(pos);
  };

  // Handler para atualizar permissões via AccessButton
  const handlePermissionsSaved = (row, newPermissions) => {
    // Força refresh dos dados
    crud.refresh();
  };

  return (
    <div className="space-y-2 p-2">
      <PageHeader
        title="Cargos"
        description="Gerencie os cargos e permissões da plataforma"
        routes={[
          { title: 'Configuração do Sistema' },
          { title: 'Cadastro de Cargos' },
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
        onSearch={crud.setFilters}
        onClear={crud.clearFilters}
      />

      <PageTable
        screenKey={SCREEN_KEY}
        columns={[
          { key: 'name', label: 'Nome' },
          {
            key: 'departments',
            label: 'Departamentos',
            render: (val) => {
              const list = Array.isArray(val) ? val : [val];
              return (
                list
                  .map((id) => crud.lookupMaps.departments[id])
                  .filter(Boolean)
                  .join(', ') || '-'
              );
            },
          },
          { key: 'created_at', label: 'Criado em', type: 'date' },
          { key: 'updated_at', label: 'Atualizado em', type: 'date' },
        ]}
        data={crud.pagedData}
        onSave={handleSave}
        onDelete={crud.handleDelete}
        formLoading={crud.loading}
        pagination={crud.pagination}
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
              initial={row.permissions || []}
              onSaved={(items) => handlePermissionsSaved(row, items)}
            />
          )
        }
      />
    </div>
  );
}
