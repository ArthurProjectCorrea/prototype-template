# Componentes Reutilizáveis - Prototype Template

Este documento descreve todos os componentes reutilizáveis do projeto (exceto componentes UI base).

## Índice

1. [Componentes de Layout](#componentes-de-layout)
2. [Componentes de Página](#componentes-de-página)
3. [Componentes de Navegação](#componentes-de-navegação)
4. [Componentes de Formulário](#componentes-de-formulário)
5. [Componentes Especiais](#componentes-especiais)

---

## Componentes de Layout

### AppSidebar

**Arquivo:** `components/app-sidebar.jsx`

Sidebar principal da aplicação com navegação e informações do usuário.

```jsx
import { AppSidebar } from '@/components/app-sidebar';

<AppSidebar />;
```

**Configuração do Menu:**

O menu é configurado através do objeto `data` interno:

```javascript
const data = {
  navMain: [
    {
      title: 'Dashboard',
      url: '/',
      icon: LayoutDashboard,
    },
    {
      title: 'Configurações',
      icon: SquareTerminal,
      isActive: true, // Expandido por padrão
      items: [
        // Subitens
        { title: 'Usuários', url: '/config/users' },
        { title: 'Cargos', url: '/config/positions' },
      ],
    },
  ],
  navSecondary: [{ title: 'Support', url: '#', icon: LifeBuoy }],
};
```

**Customização:**

Para adicionar novos itens ao menu, edite o objeto `data` no componente.

---

### SiteHeader

**Arquivo:** `components/app-header.jsx`

Cabeçalho fixo no topo com logo e informações do usuário.

```jsx
import { SiteHeader } from '@/components/app-header';

<SiteHeader />;
```

**Características:**

- Logo com animação hover
- Nome do usuário logado
- Trigger para sidebar
- Gradiente de cor primária

---

### AppLoading

**Arquivo:** `components/app-loading.jsx`

Overlay de loading exibido durante navegações.

```jsx
import { AppLoading } from '@/components/app-loading';

// No layout
<div className="relative flex-1">
  <AppLoading />
  {children}
</div>;
```

**Comportamento:**

- Detecta mudanças de pathname automaticamente
- Exibe spinner por 2 segundos mínimo
- Cobre apenas o conteúdo, não a sidebar

---

## Componentes de Página

### PageHeader

**Arquivo:** `components/page-header.jsx`

Cabeçalho de página com breadcrumb.

```jsx
import { PageHeader } from '@/components/page-header';

<PageHeader
  title="Cadastro de Usuários"
  description="Gerencie os acessos da plataforma"
  routes={[
    { title: 'Home', href: '/' },
    { title: 'Configuração' },
    { title: 'Usuários' },
  ]}
/>;
```

**Props:**

| Prop          | Tipo      | Obrigatório | Descrição           |
| ------------- | --------- | ----------- | ------------------- |
| `title`       | `string`  | Não         | Título principal    |
| `description` | `string`  | Não         | Descrição/subtítulo |
| `routes`      | `Route[]` | Não         | Itens do breadcrumb |

**Route Object:**

```typescript
interface Route {
  title: string; // Texto exibido
  href?: string; // URL (opcional, último item não precisa)
}
```

---

### PageFilter

**Arquivo:** `components/page-filter.jsx`

Barra de filtros dinâmica com suporte a permissões.

```jsx
import { PageFilter } from '@/components/page-filter';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

const SCREEN_KEY = 'users';

<PageFilter
  screenKey={SCREEN_KEY}
  values={filters}
  filters={[
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
  onSearch={setFilters}
  onClear={() => setFilters({})}
  showExport={true}
  onExport={(format) => console.log(format)}
/>;
```

**Props:**

| Prop         | Tipo             | Obrigatório | Descrição                               |
| ------------ | ---------------- | ----------- | --------------------------------------- |
| `screenKey`  | `string`         | Não         | Chave da tela para verificar permissões |
| `values`     | `object`         | Não         | Valores atuais dos filtros              |
| `filters`    | `FilterConfig[]` | Sim         | Configuração dos campos                 |
| `onSearch`   | `function`       | Não         | Callback ao pesquisar                   |
| `onClear`    | `function`       | Não         | Callback ao limpar                      |
| `showExport` | `boolean`        | Não         | Mostrar botão exportar                  |
| `onExport`   | `function`       | Não         | Callback exportação                     |

> **Nota:** Quando `screenKey` é fornecido, o botão de exportar só será exibido se o usuário tiver permissão `export` para a tela.

**FilterConfig:**

```typescript
interface FilterConfig {
  key: string; // Chave do filtro
  label: string; // Label do campo
  component: React.ComponentType; // Componente (Input, Select, etc)
  componentProps?: object; // Props adicionais
}
```

---

### PageTable

**Arquivo:** `components/page-table.jsx`

Tabela CRUD completa com paginação, dialogs e suporte a permissões.

```jsx
import { PageTable } from '@/components/page-table';

const SCREEN_KEY = 'users';

<PageTable
  screenKey={SCREEN_KEY}
  columns={[
    { key: 'name', label: 'Nome' },
    { key: 'email', label: 'Email' },
    {
      key: 'status',
      label: 'Status',
      render: (v) => (v ? 'Ativo' : 'Inativo'),
    },
    { key: 'created_at', label: 'Criado em', type: 'date' },
  ]}
  data={pagedData}
  refs={{ position_id: positionMap }}
  onCreate={handleCreate}
  onSave={handleSave}
  onDelete={handleDelete}
  formLoading={loading}
  pagination={{
    page: currentPage,
    totalPages: 10,
    onPageChange: setPage,
  }}
  EditForm={(props) => <UserForm {...props} />}
  headerActions={<CustomButton />}
  rowAction={(row, { hasPermission }) =>
    hasPermission('view') && <ViewButton row={row} />
  }
/>;
```

**Props:**

| Prop            | Tipo        | Obrigatório | Descrição                               |
| --------------- | ----------- | ----------- | --------------------------------------- |
| `screenKey`     | `string`    | Não         | Chave da tela para verificar permissões |
| `columns`       | `Column[]`  | Sim         | Definição das colunas                   |
| `data`          | `array`     | Sim         | Dados da página atual                   |
| `refs`          | `object`    | Não         | Lookup maps para IDs                    |
| `onCreate`      | `function`  | Não         | Antes de abrir dialog de criação        |
| `onSave`        | `function`  | Sim         | Salvar registro                         |
| `onDelete`      | `function`  | Sim         | Deletar registro                        |
| `formLoading`   | `boolean`   | Não         | Loading durante operações               |
| `pagination`    | `object`    | Não         | Configuração de paginação               |
| `rowsPerPage`   | `number`    | Não         | Auto-paginação (default: 10)            |
| `EditForm`      | `component` | Não         | Formulário de edição                    |
| `headerActions` | `ReactNode` | Não         | Componentes extras no header            |
| `rowAction`     | `function`  | Não         | Ações extras por linha                  |

> **Nota sobre Permissões:** Quando `screenKey` é fornecido:
>
> - O botão "Cadastrar" só aparece se o usuário tiver permissão `edit`
> - Os botões de edição por linha só aparecem com permissão `edit`
> - Os botões de exclusão só aparecem com permissão `delete`

**rowAction com Permissões:**

A função `rowAction` recebe um segundo argumento com utilidades de permissão:

```jsx
rowAction={(row, { hasPermission }) => (
  <>
    {hasPermission('view') && <ViewButton row={row} />}
    {hasPermission('edit') && <CustomEditButton row={row} />}
  </>
)}
```

**Column Object:**

```typescript
interface Column {
  key: string; // Campo do objeto
  label: string; // Texto do cabeçalho
  type?: 'date'; // Tipo especial
  render?: (value, row) => ReactNode; // Renderização customizada
}
```

---

## Componentes de Navegação

### NavMain

**Arquivo:** `components/nav-main.jsx`

Navegação principal da sidebar com suporte a submenus e permissões.

```jsx
import { NavMain } from '@/components/nav-main';

<NavMain
  items={[
    {
      title: 'Dashboard',
      url: '/',
      icon: HomeIcon,
    },
    {
      title: 'Configurações',
      icon: SettingsIcon,
      isActive: true,
      items: [
        {
          title: 'Usuários',
          url: '/config/users',
          key: 'users',
          verify_permission: true,
        },
        {
          title: 'Cargos',
          url: '/config/positions',
          key: 'positions',
          verify_permission: true,
        },
      ],
    },
  ]}
/>;
```

**Props:**

| Prop    | Tipo        | Obrigatório | Descrição          |
| ------- | ----------- | ----------- | ------------------ |
| `items` | `NavItem[]` | Sim         | Itens de navegação |

**NavItem:**

```typescript
interface NavItem {
  title: string;
  url?: string;
  icon: LucideIcon;
  isActive?: boolean;
  key?: string; // Chave da tela p/ verificação de permissão
  verify_permission?: boolean; // Verifica permissão 'view' antes de exibir
  items?: SubNavItem[];
}

interface SubNavItem {
  title: string;
  url?: string;
  isActive?: boolean;
  key?: string; // Chave da tela p/ verificação de permissão
  verify_permission?: boolean; // Verifica permissão 'view' antes de exibir
}
```

> **Nota:** Itens com `verify_permission: true` só serão exibidos se o usuário tiver permissão `view` para a tela indicada por `key`.

---

### NavSecondary

**Arquivo:** `components/nav-secondary.jsx`

Navegação secundária (rodapé da sidebar).

```jsx
import { NavSecondary } from '@/components/nav-secondary';

<NavSecondary
  items={[
    { title: 'Suporte', url: '/support', icon: HelpIcon },
    { title: 'Feedback', url: '/feedback', icon: MessageIcon },
  ]}
  className="mt-auto"
/>;
```

---

### NavUser

**Arquivo:** `components/nav-user.jsx`

Menu do usuário na sidebar com dropdown.

```jsx
import { NavUser } from '@/components/nav-user';

<NavUser user={currentUser} />;
```

**Props:**

| Prop   | Tipo   | Obrigatório | Descrição                                                 |
| ------ | ------ | ----------- | --------------------------------------------------------- |
| `user` | `User` | Não         | Dados do usuário (busca de localStorage se não fornecido) |

**Funcionalidades:**

- Exibe avatar com iniciais
- Dropdown com opções
- Abre dialog de configurações (perfil)
- Logout

---

## Componentes de Formulário

### LoginForm

**Arquivo:** `components/form/login-form.jsx`

Formulário de login.

```jsx
import { LoginForm } from '@/components/form/login-form';

<LoginForm
  onSubmit={({ email, password }) => handleLogin(email, password)}
  loading={isLoading}
/>;
```

---

### UserForm

**Arquivo:** `components/form/user-form.jsx`

Formulário de usuário.

```jsx
import { UserForm } from '@/components/form/user-form';

<UserForm
  row={userToEdit} // null para criar
  onClose={closeDialog}
  onSave={handleSave}
  positions={positionsList}
  loading={isSaving}
/>;
```

---

### DepartmentForm

**Arquivo:** `components/form/department-form.jsx`

Formulário de departamento.

```jsx
import { DepartmentForm } from '@/components/form/department-form';

<DepartmentForm
  row={departmentToEdit}
  onClose={closeDialog}
  onSave={handleSave}
  loading={isSaving}
/>;
```

---

### PositionForm

**Arquivo:** `components/form/position-form.jsx`

Formulário de cargo.

```jsx
import { PositionForm } from '@/components/form/position-form';

<PositionForm
  row={positionToEdit}
  onClose={closeDialog}
  onSave={handleSave}
  departments={departmentsList}
  loading={isSaving}
/>;
```

---

### ProfileForm

**Arquivo:** `components/form/profile-form.jsx`

Formulário de perfil do usuário logado.

```jsx
import { ProfileForm } from '@/components/form/profile-form';

<ProfileForm />;
```

---

### ConfigForm

**Arquivo:** `components/form/config-form.jsx`

Formulário de configurações gerais.

```jsx
import { ConfigForm } from '@/components/form/config-form';

<ConfigForm />;
```

---

## Componentes Especiais

### LoginScreen

**Arquivo:** `components/login-screen.jsx`

Tela completa de login com card centralizado.

```jsx
import { LoginScreen } from '@/components/login-screen';

<LoginScreen />;
```

**Características:**

- Card centralizado
- Integração com API de usuários
- Armazena em localStorage e cookie
- Redireciona para home após login

---

### SettingsDialog

**Arquivo:** `components/settings-dialog.jsx`

Dialog de configurações com navegação interna.

```jsx
import { SettingsDialog } from '@/components/settings-dialog';

<SettingsDialog open={isOpen} onOpenChange={setIsOpen} />;
```

**Seções:**

- Geral (ProfileForm)
- Configurações (ConfigForm)
- Permissões (PermissionsSection)

---

### PermissionsSection

**Arquivo:** `components/permissions-section.jsx`

Exibe permissões do usuário atual.

```jsx
import { PermissionsSection } from '@/components/permissions-section';

<PermissionsSection />;
```

**Características:**

- Busca permissões do cargo do usuário
- Exibe tabela tela x permissão

---

### AccessButton

**Arquivo:** `components/buttons/access-button.jsx`

Botão + dialog para gerenciar permissões de um cargo.

```jsx
import { AccessButton } from '@/components/buttons/access-button';

<AccessButton
  positionId={cargoId}
  initial={permissoesExistentes}
  onSaved={(newPermissions) => updatePosition(newPermissions)}
/>;
```

**Props:**

| Prop         | Tipo           | Obrigatório | Descrição           |
| ------------ | -------------- | ----------- | ------------------- |
| `positionId` | `number`       | Sim         | ID do cargo         |
| `initial`    | `Permission[]` | Não         | Permissões iniciais |
| `onSaved`    | `function`     | Não         | Callback ao salvar  |

---

### AppUser

**Arquivo:** `components/app-user.jsx`

Dropdown de usuário para uso em headers/toolbars.

```jsx
import { AppUser } from '@/components/app-user';

<AppUser user={currentUser} />;
```

**Diferença de NavUser:**

- `NavUser`: Para sidebar, layout maior
- `AppUser`: Para header, botão compacto

---

### ModeToggle

**Arquivo:** `components/mode-toggle.jsx`

Toggle de tema claro/escuro.

```jsx
import { ModeToggle } from '@/components/mode-toggle';

<ModeToggle />;
```

---

### ThemeProvider

**Arquivo:** `components/theme-provider.jsx`

Provider para gerenciamento de tema.

```jsx
import { ThemeProvider } from '@/components/theme-provider';

<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  {children}
</ThemeProvider>;
```

---

## Convenções

### Criando Novos Componentes

1. **Componentes de UI base**: `components/ui/`
2. **Componentes de layout**: `components/` (raiz)
3. **Componentes de formulário**: `components/form/`
4. **Botões/ações especiais**: `components/buttons/`

### Padrão de Props

```jsx
export function MyComponent({
  // Required props first
  data,
  onSave,

  // Optional props with defaults
  loading = false,
  className,

  // Spread rest for flexibility
  ...props
}) {
  // ...
}
```

### Nomenclatura

| Tipo       | Padrão         | Exemplo           |
| ---------- | -------------- | ----------------- |
| Componente | PascalCase     | `PageHeader`      |
| Arquivo    | kebab-case     | `page-header.jsx` |
| Prop       | camelCase      | `onSave`          |
| Handler    | handle[Action] | `handleSave`      |

---

_Documentação atualizada em: Março 2026_
