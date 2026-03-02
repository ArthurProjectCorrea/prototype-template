# Padrão de Páginas - Prototype Template

Este documento define os padrões de construção de páginas, comunicação com APIs e sistema de permissões.

## Índice

1. [Autenticação](#autenticação)
2. [Sistema de Permissões](#sistema-de-permissões)
3. [Estrutura de Pastas](#estrutura-de-pastas)
4. [Página CRUD Padrão](#página-crud-padrão)
5. [Páginas Personalizadas](#páginas-personalizadas)
6. [Hooks Disponíveis](#hooks-disponíveis)

---

## Autenticação

Sistema de autenticação usando **Supabase Auth**.

### Fluxo de Autenticação

1. **Login**: Página `/login` usa `useAuth` hook
2. **Validação**: Supabase Auth valida credenciais
3. **Sessão**: Cookies gerenciados automaticamente pelo Supabase
4. **Middleware**: Proxy valida sessão e redireciona se necessário
5. **Logout**: Limpa sessão e redireciona para `/login`

### useAuth - Hook React

```javascript
import { useAuth } from '@/hooks/use-auth';

function MeuComponente() {
  const { user, loading, ready, isAuthenticated, login, logout, refresh } =
    useAuth();

  // ready = true quando terminou de carregar sessão
  // loading = true durante operações de auth

  const handleLogin = async () => {
    const result = await login(email, password);
    if (result.success) {
      // Redireciona automaticamente para /
    }
  };
}
```

### Proteção de Rotas

- **Middleware (`proxy.js`)**: Verifica sessão Supabase para rotas `/(private)`
- **Redirecionamento**: Sem sessão → `/login`
- **Com sessão válida**: Acesso liberado

---

## Sistema de Permissões

Sistema de controle de acesso baseado em **cargo** (position) e **tela** (screen).

### Estrutura de Dados

```
positions (cargo)
    ↓
access (position_id, screen_id, permission_id)
    ↓         ↓
screens   permissions
```

### Tipos de Permissão

| Key      | Descrição       | Controla                       |
| -------- | --------------- | ------------------------------ |
| `view`   | Visualizar tela | Visibilidade no menu (NavMain) |
| `edit`   | Criar/Editar    | Botão "Cadastrar" e "Editar"   |
| `delete` | Excluir         | Botão "Excluir"                |
| `export` | Exportar        | Botão "Exportar"               |
| `grant`  | Conceder acesso | Botão "Acessos" em Cargos      |

### usePermission - Hook React

```javascript
import { usePermission } from '@/hooks/use-permission';

function MeuComponente() {
  const {
    hasPermission,      // Verifica permissão específica
    canView,            // Atalho para 'view'
    canEdit,            // Atalho para 'edit'
    canDelete,          // Atalho para 'delete'
    canExport,          // Atalho para 'export'
    loading,            // Carregando permissões
    ready,              // Permissões carregadas
    permissions,        // Array de todas permissões
    getPermissionsFor   // Retorna permissões de uma tela
  } = usePermission();

  // Exemplos de uso
  if (hasPermission('users', 'edit')) { ... }
  if (canView('users')) { ... }
  if (canDelete('positions')) { ... }
}
```

### SCREEN_KEY - Padrão Obrigatório

**Toda página CRUD deve declarar sua `SCREEN_KEY`:**

```jsx
const SCREEN_KEY = 'users';

export default function UsersPage() {
  // ...
}
```

A `SCREEN_KEY` deve corresponder à key registrada na tabela `screens`:

```sql
INSERT INTO screens (name, key) VALUES ('Usuários', 'users');
```

---

## Estrutura de Pastas

```
app/
├── (auth)/           → Páginas públicas de autenticação
│   └── login/
│       └── page.jsx
├── (private)/        → Páginas protegidas (requer login)
│   ├── layout.jsx    → Layout com sidebar + header
│   ├── page.jsx      → Dashboard (/)
│   └── config/       → Páginas de configuração
│       ├── departments/
│       │   └── page.jsx
│       ├── positions/
│       │   └── page.jsx
│       └── users/
│           └── page.jsx
└── (public)/         → Páginas públicas sem auth
    └── exemple/
        └── page.jsx
```

---

## Página CRUD Padrão

### Template Completo

```jsx
'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import { MeuForm } from '@/components/forms/meu-form';
import { Input } from '@/components/ui/input';
import { useCrud } from '@/hooks/use-crud';

const SCREEN_KEY = 'minha_tela';

export default function MinhaPagina() {
  const crud = useCrud({
    endpoint: '/api/minha-tabela',
    pageSize: 10,
    relations: [
      { key: 'relacionada', endpoint: '/api/relacionada', labelKey: 'name' },
    ],
    messages: {
      createSuccess: 'Criado com sucesso',
      updateSuccess: 'Atualizado com sucesso',
      deleteSuccess: 'Excluído com sucesso',
      createError: 'Erro ao criar',
      updateError: 'Erro ao atualizar',
      deleteError: 'Erro ao excluir',
    },
  });

  return (
    <div className="space-y-2 p-2 sm:p-4">
      <PageHeader
        title="Minha Página"
        description="Descrição da página"
        routes={[{ title: 'Categoria' }, { title: 'Minha Página' }]}
      />

      <DataTable
        screenKey={SCREEN_KEY}
        columns={[
          { key: 'name', label: 'Nome' },
          {
            key: 'relacionada_id',
            label: 'Relacionada',
            render: (val) => crud.lookupMaps.relacionada[val] || '-',
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
        ]}
        data={crud.data}
        loading={crud.initialLoading}
        onSave={crud.handleSave}
        onDelete={crud.handleDelete}
        formLoading={crud.loading}
        EditForm={(props) => (
          <MeuForm
            {...props}
            relacionadas={crud.relatedData.relacionada || []}
            loading={crud.loading}
          />
        )}
      />
    </div>
  );
}
```

### Anatomia da Página CRUD

#### 1. Constante SCREEN_KEY

```jsx
const SCREEN_KEY = 'users';
```

Obrigatória para integração com sistema de permissões.

#### 2. Hook useCrud

```jsx
const crud = useCrud({
  endpoint: '/api/users',        // Endpoint da API
  pageSize: 10,                  // Itens por página
  relations: [...],              // Tabelas relacionadas
  messages: {...},               // Mensagens de toast
});
```

#### 3. PageHeader

```jsx
<PageHeader
  title="Título"
  description="Descrição"
  routes={[{ title: 'Breadcrumb' }]}
/>
```

#### 4. DataTable

```jsx
<DataTable
  screenKey={SCREEN_KEY}         // Para permissões
  columns={[...]}                // Definição de colunas
  filters={[...]}                // Filtros disponíveis
  data={crud.data}               // Dados da API
  loading={crud.initialLoading}  // Loading inicial
  onSave={crud.handleSave}       // Handler de save
  onDelete={crud.handleDelete}   // Handler de delete
  formLoading={crud.loading}     // Loading do form
  EditForm={...}                 // Componente de formulário
/>
```

---

## Definição de Colunas

### Propriedades

| Propriedade    | Tipo       | Descrição                          |
| -------------- | ---------- | ---------------------------------- |
| `key`          | `string`   | Nome do campo no objeto            |
| `label`        | `string`   | Rótulo exibido no header           |
| `type`         | `string`   | Tipo: `date`, `number`, etc.       |
| `render`       | `function` | Função de renderização customizada |
| `hideOnMobile` | `boolean`  | Esconder em telas pequenas         |

### Exemplos

```jsx
columns={[
  // Coluna simples
  { key: 'name', label: 'Nome' },

  // Coluna com lookup
  {
    key: 'position_id',
    label: 'Cargo',
    render: (val) => crud.lookupMaps.positions[val] || '-',
  },

  // Coluna de data (escondida em mobile)
  {
    key: 'created_at',
    label: 'Criado em',
    type: 'date',
    hideOnMobile: true
  },

  // Coluna com render customizado
  {
    key: 'status',
    label: 'Status',
    render: (val) => <Badge variant={val}>{val}</Badge>,
  },
]}
```

---

## Definição de Filtros

### Estrutura

```jsx
filters={[
  {
    key: 'name',           // Campo a filtrar
    label: 'Nome',         // Label do filtro
    component: (props) => <Input {...props} />,
  },
]}
```

### Filtro com Select

```jsx
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
}
```

---

## Row Actions Customizadas

Para adicionar botões extras na coluna de ações:

```jsx
<DataTable
  screenKey={SCREEN_KEY}
  // ...
  rowAction={(row, { hasPermission }) =>
    hasPermission('grant') && (
      <AccessButton positionId={row.id} onSaved={() => crud.refresh()} />
    )
  }
/>
```

---

## Páginas Personalizadas

Para páginas que não são CRUD puro, mantenha o máximo do padrão:

### Estrutura Recomendada

```jsx
'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { usePermission } from '@/hooks/use-permission';

const SCREEN_KEY = 'dashboard';

export default function DashboardPage() {
  const { hasPermission, canView } = usePermission();

  // Verificar permissão de visualização
  if (!canView(SCREEN_KEY)) {
    return <div>Sem permissão</div>;
  }

  return (
    <div className="space-y-2 p-2 sm:p-4">
      <PageHeader
        title="Dashboard"
        description="Visão geral"
        routes={[{ title: 'Dashboard' }]}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>Conteúdo</CardHeader>
          <CardContent>...</CardContent>
        </Card>
      </div>
    </div>
  );
}
```

---

## Hooks Disponíveis

### useCrud

```javascript
import { useCrud } from '@/hooks/use-crud';

const crud = useCrud({
  endpoint: '/api/tabela',
  pageSize: 10,
  relations: [{ key: 'rel', endpoint: '/api/rel', labelKey: 'name' }],
  messages: { createSuccess: '...', ... },
});

// Retornos disponíveis:
crud.data              // Array de dados
crud.filteredData      // Dados filtrados
crud.relatedData       // Dados das relações
crud.lookupMaps        // Maps para lookup (id → nome)
crud.loading           // Estado de loading
crud.initialLoading    // Loading inicial
crud.handleSave        // Função de salvar
crud.handleDelete      // Função de deletar
crud.refresh           // Recarregar dados
crud.pagination        // Objeto de paginação
```

### useAuth

```javascript
import { useAuth } from '@/hooks/use-auth';

const { user, isAuthenticated, login, logout, ready, loading } = useAuth();
```

### usePermission

```javascript
import { usePermission } from '@/hooks/use-permission';

const { hasPermission, canView, canEdit, canDelete, canExport, ready } =
  usePermission();
```

### useApi

```javascript
import { useApi } from '@/hooks/use-api';

const api = useApi('/api/tabela', { messages, showToasts: true });
await api.save(item); // POST ou PUT
await api.remove(id); // DELETE
await api.get(id); // GET por ID
await api.getAll(); // GET todos
```

---

## Convenções

### Nomenclatura de Arquivos

- **Páginas**: `page.jsx` em pasta com nome da rota
- **Formulários**: `[nome]-form.jsx` em `components/forms/`
- **Botões especiais**: `[nome]-button.jsx` em `components/buttons/`

### Responsividade

- Usar `p-2 sm:p-4` para padding
- Usar `hideOnMobile: true` em colunas de data
- DataTable já é responsivo por padrão

### Mensagens

- Toast de sucesso: verde
- Toast de erro: vermelho
- Mensagens em português

---

_Documentação atualizada em: Março 2026_
