# Padrão de Páginas - Prototype Template

Este documento define os padrões de construção de páginas e comunicação com APIs.

## Índice

1. [Autenticação](#autenticação)
2. [Sistema de Permissões](#sistema-de-permissões)
3. [Estrutura de Pastas](#estrutura-de-pastas)
4. [Hooks de Comunicação](#hooks-de-comunicação)
5. [Página CRUD Padrão](#página-crud-padrão)
6. [Componentes de Página](#componentes-de-página)
7. [Exemplos Práticos](#exemplos-práticos)
8. [Páginas Personalizadas](#páginas-personalizadas)

---

## Autenticação

Sistema simplificado de login/logout usando localStorage e cookies.

### lib/auth.js - Funções de Autenticação

```javascript
import { login, logout, getUser, isAuthenticated, setUser, clearUser } from '@/lib/auth';

// Login - valida credenciais e salva usuário
const result = await login(email, password);
// result: { success: true, user: {...} } ou { success: false, error: 'mensagem' }

// Logout - limpa localStorage/cookie e redireciona para /login
logout();

// Obter usuário atual
const user = getUser();

// Verificar se está autenticado
if (isAuthenticated()) { ... }

// Salvar/limpar usuário manualmente
setUser(userData);
clearUser();
```

### useAuth - Hook React

```javascript
import { useAuth } from '@/hooks/use-auth';

function MeuComponente() {
  const { user, loading, ready, isAuthenticated, login, logout, refresh } =
    useAuth();

  // ready = true quando terminou de carregar do localStorage
  // loading = true durante login

  const handleLogin = async () => {
    const result = await login(email, password);
    if (result.success) {
      // Redireciona automaticamente para /
    }
  };
}
```

### Fluxo de Autenticação

1. **Login**: Página `/login` usa `useAuth` hook
2. **Validação**: `lib/auth.js` busca usuário via API e valida credenciais
3. **Armazenamento**: Dados salvos em localStorage e cookie
4. **Redirecionamento**: Sucesso → `/`, Falha → toast de erro
5. **Logout**: `logout()` limpa dados e redireciona para `/login`

### Proteção de Rotas

- **Middleware**: Verifica cookie `user` para rotas `/(private)`
- **Layout Privado**: Validação server-side com `cookies()`

---

## Sistema de Permissões

Sistema de controle de acesso baseado em cargo e tela.

### Estrutura de Permissões

Permissões são definidas por cargo em `positions.json`:

```json
{
  "id": 1,
  "name": "Administrador",
  "permissions": [
    { "screen_key": "users", "permission_key": "view" },
    { "screen_key": "users", "permission_key": "edit" },
    { "screen_key": "users", "permission_key": "delete" },
    { "screen_key": "users", "permission_key": "export" }
  ]
}
```

### Tipos de Permissão

| Key      | Descrição       | Controla                       |
| -------- | --------------- | ------------------------------ |
| `view`   | Visualizar tela | Visibilidade no menu (NavMain) |
| `edit`   | Criar/Editar    | Botão "Cadastrar" e "Editar"   |
| `delete` | Excluir         | Botão "Excluir"                |
| `export` | Exportar        | Botão "Exportar"               |

### usePermission - Hook React

```javascript
import { usePermission } from '@/hooks/use-permission';

function MeuComponente() {
  const {
    hasPermission,   // Verifica permissão específica
    canView,         // Atalho para 'view'
    canEdit,         // Atalho para 'edit'
    canDelete,       // Atalho para 'delete'
    canExport,       // Atalho para 'export'
    loading,         // Carregando permissões
    ready,           // Permissões carregadas
    permissions,     // Array de todas permissões
    getPermissionsFor  // Retorna permissões de uma tela
  } = usePermission();

  // Exemplos de uso
  if (hasPermission('users', 'edit')) { ... }
  if (canView('users')) { ... }
  if (canDelete('positions')) { ... }

  // Listar permissões de uma tela
  const perms = getPermissionsFor('users'); // ['view', 'edit', 'delete']
}
```

### SCREEN_KEY - Padrão de Páginas

**Toda página CRUD deve declarar sua `SCREEN_KEY`** no início do arquivo:

```jsx
const SCREEN_KEY = 'users';

export default function UsersPage() {
  // ...
}
```

A `SCREEN_KEY` deve corresponder à key registrada em `screens.json`:

```json
{ "id": 1, "name": "Usuários", "key": "users" }
```

### Integração com Componentes

#### PageFilter com Permissão de Export

```jsx
<PageFilter
  screenKey={SCREEN_KEY} // Verifica permissão 'export'
  showExport={true} // Exibe botão (desabilitado se sem permissão)
  onExport={(format) => handleExport(format)}
  // ...
/>
```

#### PageTable com Permissões de Edit/Delete

```jsx
<PageTable
  screenKey={SCREEN_KEY} // Verifica permissões 'edit' e 'delete'
  // Botões desaparecem se usuário não tem permissão
  // ...
/>
```

#### rowAction com Permissão Customizada

```jsx
<PageTable
  screenKey={SCREEN_KEY}
  rowAction={(row, { hasPermission }) => (
    <>
      {hasPermission('custom') && <MeuBotao row={row} />}
      <OutroBotao row={row} />
    </>
  )}
/>
```

### Controle de Menu (NavMain)

O menu é filtrado automaticamente com base na permissão `view`:

```javascript
// app-sidebar.jsx - Configuração do menu
const data = {
  navMain: [
    {
      title: 'Dashboard',
      url: '/',
      verify_permission: false, // Sempre visível
      key: 'dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Configurações',
      icon: SquareTerminal,
      items: [
        {
          title: 'Usuários',
          url: '/config/users',
          verify_permission: true, // Verifica permissão 'view'
          key: 'users', // Deve corresponder à screen_key
        },
      ],
    },
  ],
};
```

- `verify_permission: false` → Item sempre visível
- `verify_permission: true` → Verifica se usuário tem `view` para a `key`
- Grupos sem itens visíveis ficam ocultos automaticamente

---

## Estrutura de Pastas

```
app/
├── (auth)/          # Páginas de autenticação (login, registro)
│   └── login/
├── (private)/       # Páginas protegidas (requer autenticação)
│   ├── layout.jsx   # Layout com sidebar e header
│   ├── page.jsx     # Dashboard principal
│   └── config/      # Páginas de configuração
│       ├── users/
│       ├── positions/
│       └── departments/
├── (public)/        # Páginas públicas
│   └── exemple/
└── api/             # Endpoints da API
```

### Nomenclatura

| Tipo               | Padrão                | Exemplo          |
| ------------------ | --------------------- | ---------------- |
| Pasta de página    | `kebab-case`          | `user-settings/` |
| Arquivo de página  | `page.jsx`            | `page.jsx`       |
| Componente de form | `[entidade]-form.jsx` | `user-form.jsx`  |

---

## Hooks de Comunicação

### useApi - Comunicação Básica

Hook para comunicação direta com endpoints da API.

```javascript
import { useApi } from '@/hooks/use-api';

const api = useApi('/api/users', {
  showToasts: true,
  messages: {
    createSuccess: 'Usuário criado com sucesso',
    updateSuccess: 'Usuário atualizado com sucesso',
    deleteSuccess: 'Usuário excluído com sucesso',
  },
});

// Métodos disponíveis
await api.getAll(); // Lista todos
await api.getById(1); // Busca por ID
await api.create(data); // Cria novo
await api.update(data); // Atualiza (data.id obrigatório)
await api.remove(id); // Remove
await api.save(data); // Cria ou atualiza baseado em data.id

// Estados
api.loading; // boolean - carregando
api.error; // string | null - mensagem de erro
```

### useCrud - Gerenciamento Completo de CRUD

Hook para páginas CRUD completas com filtros, paginação e relacionamentos.

```javascript
import { useCrud } from '@/hooks/use-crud';

const crud = useCrud({
  endpoint: '/api/users',
  pageSize: 10,
  relations: [
    { key: 'positions', endpoint: '/api/positions', labelKey: 'name' },
  ],
  messages: {
    createSuccess: 'Usuário criado com sucesso',
  },
});

// Data
crud.data; // Dados completos
crud.filteredData; // Dados filtrados
crud.pagedData; // Dados da página atual
crud.relatedData; // { positions: [...] }
crud.lookupMaps; // { positions: { 1: 'Admin', 2: 'User' } }

// Filtros
crud.filters; // Objeto com filtros atuais
crud.setFilters({ name: 'João' });
crud.clearFilters();

// Paginação
crud.page; // Página atual
crud.setPage(2);
crud.totalPages; // Total de páginas
crud.pagination; // Objeto pronto para PageTable

// Estados
crud.loading; // Operação em andamento
crud.initialLoading; // Carregamento inicial

// Handlers
await crud.handleSave(item); // Salva (cria ou atualiza)
await crud.handleDelete(item); // Remove
await crud.refresh(); // Recarrega dados
```

---

## Página CRUD Padrão

### Estrutura Básica

```jsx
'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { PageTable } from '@/components/page-table';
import { PageFilter } from '@/components/page-filter';
import { EntityForm } from '@/components/form/entity-form';
import { Input } from '@/components/ui/input';
import { useCrud } from '@/hooks/use-crud';

// Identificador da tela para o sistema de permissões
const SCREEN_KEY = 'entities';

export default function EntitiesPage() {
  const crud = useCrud({
    endpoint: '/api/entities',
    pageSize: 10,
    relations: [
      // { key: 'related', endpoint: '/api/related' },
    ],
  });

  return (
    <div className="space-y-2 p-2">
      <PageHeader
        title="Título da Página"
        description="Descrição da página"
        routes={[{ title: 'Categoria' }, { title: 'Título da Página' }]}
      />

      <PageFilter
        screenKey={SCREEN_KEY}
        values={crud.filters}
        filters={[
          {
            key: 'name',
            label: 'Nome',
            component: (props) => <Input {...props} />,
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
          <EntityForm
            {...props}
            relatedData={crud.relatedData}
            loading={crud.loading}
          />
        )}
      />
    </div>
  );
}
```

### Com Relacionamentos

```jsx
const crud = useCrud({
  endpoint: '/api/users',
  pageSize: 10,
  relations: [
    { key: 'positions', endpoint: '/api/positions', labelKey: 'name' },
    { key: 'departments', endpoint: '/api/departments', labelKey: 'name' },
  ],
});

// No PageTable, use lookupMaps para exibir nomes em vez de IDs
<PageTable
  columns={[
    { key: 'name', label: 'Nome' },
    {
      key: 'position_id',
      label: 'Cargo',
      render: (val) => crud.lookupMaps.positions[val] || '',
    },
  ]}
  refs={{ position_id: crud.lookupMaps.positions }}
  // ...
/>;
```

---

## Componentes de Página

### PageHeader

Cabeçalho com breadcrumb e título.

```jsx
<PageHeader
  title="Título Principal"
  description="Descrição opcional"
  routes={[
    { title: 'Home', href: '/' }, // Com link
    { title: 'Configuração' }, // Sem link (texto)
    { title: 'Usuários' }, // Último item (página atual)
  ]}
/>
```

### PageFilter

Barra de filtros configurável.

```jsx
<PageFilter
  values={filters} // Valores atuais dos filtros
  filters={[
    // Definição dos campos
    {
      key: 'name',
      label: 'Nome',
      component: (props) => <Input {...props} />,
    },
    {
      key: 'status',
      label: 'Status',
      component: (props) => (
        <Select {...props}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
          </SelectContent>
        </Select>
      ),
    },
  ]}
  onSearch={setFilters} // Callback ao pesquisar
  onClear={() => setFilters({})} // Callback ao limpar
  showExport={true} // Mostrar botão exportar
  onExport={(format) => {}} // Callback exportação ('csv' | 'pdf')
/>
```

### PageTable

Tabela com CRUD integrado.

```jsx
<PageTable
  columns={[
    { key: 'name', label: 'Nome' },
    { key: 'email', label: 'Email' },
    {
      key: 'status',
      label: 'Status',
      render: (val) => (val ? 'Ativo' : 'Inativo'),
    },
    { key: 'created_at', label: 'Criado em', type: 'date' },
  ]}
  data={pagedData} // Dados da página atual
  refs={{ position_id: positionMap }} // Lookup maps
  // Handlers
  onCreate={handleCreate} // Antes de abrir dialog de criação
  onSave={handleSave} // Salvar (criar/atualizar)
  onDelete={handleDelete} // Deletar
  // Estados
  formLoading={loading} // Loading durante save
  // Paginação
  pagination={{
    page: 1,
    totalPages: 10,
    onPageChange: setPage,
  }}
  rowsPerPage={10} // Auto-paginação se pagination não fornecido
  // Customização
  EditForm={(props) => <MyForm {...props} />} // Formulário customizado
  headerActions={<CustomButton />} // Botões extras no header
  rowAction={(row) => <CustomAction row={row} />} // Ações extras por linha
/>
```

---

## Exemplos Práticos

### Exemplo Completo: Página de Produtos

```jsx
'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { PageTable } from '@/components/page-table';
import { PageFilter } from '@/components/page-filter';
import { ProductForm } from '@/components/form/product-form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { useCrud } from '@/hooks/use-crud';

export default function ProductsPage() {
  const crud = useCrud({
    endpoint: '/api/products',
    pageSize: 10,
    relations: [
      { key: 'categories', endpoint: '/api/categories', labelKey: 'name' },
    ],
    messages: {
      createSuccess: 'Produto criado com sucesso',
      updateSuccess: 'Produto atualizado com sucesso',
      deleteSuccess: 'Produto excluído com sucesso',
    },
  });

  return (
    <div className="space-y-2 p-2">
      <PageHeader
        title="Produtos"
        description="Gerencie os produtos do catálogo"
        routes={[{ title: 'Estoque' }, { title: 'Produtos' }]}
      />

      <PageFilter
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
            key: 'category_id',
            label: 'Categoria',
            component: (props) => (
              <Select {...props} className="w-full">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  {(crud.relatedData.categories || []).map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ),
          },
        ]}
        onSearch={crud.setFilters}
        onClear={crud.clearFilters}
        showExport={true}
        onExport={(format) => {
          if (format === 'csv') {
            const csv = crud.filteredData
              .map((p) => `${p.id},${p.name},${p.price}`)
              .join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'products.csv';
            a.click();
          }
        }}
      />

      <PageTable
        columns={[
          { key: 'name', label: 'Nome' },
          {
            key: 'price',
            label: 'Preço',
            render: (val) => `R$ ${val?.toFixed(2) || '0.00'}`,
          },
          {
            key: 'category_id',
            label: 'Categoria',
            render: (val) => crud.lookupMaps.categories[val] || '-',
          },
          { key: 'created_at', label: 'Criado em', type: 'date' },
        ]}
        data={crud.pagedData}
        refs={{ category_id: crud.lookupMaps.categories }}
        onSave={crud.handleSave}
        onDelete={crud.handleDelete}
        formLoading={crud.loading}
        pagination={crud.pagination}
        EditForm={(props) => (
          <ProductForm
            {...props}
            categories={crud.relatedData.categories || []}
            loading={crud.loading}
          />
        )}
      />
    </div>
  );
}
```

---

## Páginas Personalizadas

Para páginas que não seguem o padrão CRUD, use os hooks diretamente:

### Dashboard com Dados Agregados

```jsx
'use client';

import * as React from 'react';
import { useFetch } from '@/hooks/use-api';

export default function DashboardPage() {
  const [stats, setStats] = React.useState({ users: 0, products: 0 });

  const fetchUsers = useFetch('/api/users');
  const fetchProducts = useFetch('/api/products');

  React.useEffect(() => {
    Promise.all([fetchUsers(), fetchProducts()]).then(([users, products]) => {
      setStats({
        users: users.length,
        products: products.length,
      });
    });
  }, []);

  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      <Card>
        <CardTitle>Usuários</CardTitle>
        <CardContent>{stats.users}</CardContent>
      </Card>
      <Card>
        <CardTitle>Produtos</CardTitle>
        <CardContent>{stats.products}</CardContent>
      </Card>
    </div>
  );
}
```

### Página com Formulário Único

```jsx
'use client';

import { useApi } from '@/hooks/use-api';

export default function SettingsPage() {
  const api = useApi('/api/settings');
  const [settings, setSettings] = React.useState(null);

  React.useEffect(() => {
    api.getById(1).then(setSettings);
  }, []);

  const handleSave = async (data) => {
    const updated = await api.save({ ...settings, ...data });
    setSettings(updated);
  };

  return (
    <SettingsForm data={settings} onSave={handleSave} loading={api.loading} />
  );
}
```

---

## Boas Práticas

### ✅ Faça

- Use `useCrud` para páginas CRUD padrão
- Use `useApi` para operações específicas
- Sempre defina `messages` customizadas em português
- Use `lookupMaps` para exibir nomes de relacionamentos
- Mantenha formulários em arquivos separados (`components/form/`)

### ❌ Evite

- Não faça fetch direto com `fetch()` em páginas CRUD
- Não duplique lógica de filtro/paginação
- Não crie páginas sem `PageHeader`
- Não misture estilos inline com classes Tailwind

---

## Checklist para Nova Página CRUD

1. [ ] Criar JSON em `database/[entidade].json`
2. [ ] Criar API em `app/api/[entidade]/route.js`
3. [ ] Criar Form em `components/form/[entidade]-form.jsx`
4. [ ] Criar Página em `app/(private)/[categoria]/[entidade]/page.jsx`
5. [ ] Adicionar item no menu em `components/app-sidebar.jsx`

---

_Documentação atualizada em: Março 2026_
