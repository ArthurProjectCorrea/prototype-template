# Componentes Reutilizáveis - Prototype Template

Este documento descreve os componentes reutilizáveis do projeto (exceto componentes UI base).

## Índice

1. [Componentes de Layout](#componentes-de-layout)
2. [Componentes de Página](#componentes-de-página)
3. [Componentes de Formulário](#componentes-de-formulário)
4. [Componentes Especiais](#componentes-especiais)

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

O menu é configurado através do objeto `data` interno e filtrado automaticamente baseado nas permissões do usuário:

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
      isActive: true,
      items: [
        { title: 'Usuários', url: '/config/users', screenKey: 'users' },
        { title: 'Cargos', url: '/config/positions', screenKey: 'positions' },
        {
          title: 'Departamentos',
          url: '/config/departments',
          screenKey: 'departments',
        },
      ],
    },
  ],
};
```

**Nota:** Items com `screenKey` são filtrados automaticamente pela permissão `view`.

---

### SiteHeader

**Arquivo:** `components/app-header.jsx`

Cabeçalho fixo no topo com logo e trigger da sidebar.

```jsx
import { SiteHeader } from '@/components/app-header';

<SiteHeader />;
```

---

### AppLoading

**Arquivo:** `components/app-loading.jsx`

Overlay de loading exibido durante navegações.

```jsx
import { AppLoading } from '@/components/app-loading';

<div className="relative flex-1">
  <AppLoading />
  {children}
</div>;
```

---

## Componentes de Página

### PageHeader

**Arquivo:** `components/page-header.jsx`

Cabeçalho de página com breadcrumb.

```jsx
import { PageHeader } from '@/components/page-header';

<PageHeader
  title="Título da Página"
  description="Descrição opcional"
  routes={[{ title: 'Categoria' }, { title: 'Página Atual' }]}
/>;
```

**Props:**

| Prop          | Tipo     | Descrição                   |
| ------------- | -------- | --------------------------- |
| `title`       | `string` | Título principal (opcional) |
| `description` | `string` | Subtítulo (opcional)        |
| `routes`      | `array`  | Array de breadcrumb items   |

---

### DataTable

**Arquivo:** `components/data-table.jsx`

Componente unificado para tabelas CRUD com filtros, paginação, ordenação e permissões.

```jsx
import { DataTable } from '@/components/data-table';

<DataTable
  screenKey="users"
  columns={[
    { key: 'name', label: 'Nome' },
    { key: 'email', label: 'Email' },
    { key: 'created_at', label: 'Criado em', type: 'date', hideOnMobile: true },
  ]}
  filters={[
    {
      key: 'name',
      label: 'Nome',
      component: (props) => <Input {...props} placeholder="Buscar..." />,
    },
  ]}
  data={data}
  loading={loading}
  onSave={handleSave}
  onDelete={handleDelete}
  formLoading={formLoading}
  EditForm={(props) => <MeuForm {...props} />}
/>;
```

**Props Principais:**

| Prop          | Tipo        | Descrição                                  |
| ------------- | ----------- | ------------------------------------------ |
| `screenKey`   | `string`    | Key para verificação de permissões         |
| `columns`     | `array`     | Definição das colunas                      |
| `filters`     | `array`     | Definição dos filtros                      |
| `data`        | `array`     | Dados a exibir                             |
| `loading`     | `boolean`   | Estado de loading inicial                  |
| `onSave`      | `function`  | Callback de salvar (create/update)         |
| `onDelete`    | `function`  | Callback de deletar                        |
| `formLoading` | `boolean`   | Estado de loading do formulário            |
| `EditForm`    | `component` | Componente de formulário para criar/editar |
| `rowAction`   | `function`  | Render function para ações extras          |
| `rowsPerPage` | `number`    | Linhas por página (default: 10)            |
| `refs`        | `object`    | Mapas de lookup para campos de referência  |

**Definição de Colunas:**

```jsx
columns={[
  // Coluna básica
  { key: 'name', label: 'Nome' },

  // Coluna com tipo (formatação automática)
  { key: 'created_at', label: 'Criado em', type: 'date' },

  // Coluna com render customizado
  {
    key: 'status',
    label: 'Status',
    render: (value, row) => <Badge>{value}</Badge>,
  },

  // Coluna escondida em mobile
  { key: 'updated_at', label: 'Atualizado', type: 'date', hideOnMobile: true },
]}
```

**Definição de Filtros:**

```jsx
filters={[
  // Filtro de texto
  {
    key: 'name',
    label: 'Nome',
    component: (props) => <Input {...props} placeholder="Buscar..." />,
  },

  // Filtro de select
  {
    key: 'status',
    label: 'Status',
    component: (props) => (
      <Select {...props}>
        <SelectTrigger><SelectValue placeholder="--" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="active">Ativo</SelectItem>
          <SelectItem value="inactive">Inativo</SelectItem>
        </SelectContent>
      </Select>
    ),
  },
]}
```

**Row Actions:**

```jsx
rowAction={(row, { hasPermission }) => (
  <>
    {hasPermission('custom') && (
      <Button onClick={() => handleCustom(row)}>
        Ação
      </Button>
    )}
  </>
)}
```

**Recursos Automáticos:**

- ✅ Responsividade (colunas `hideOnMobile`)
- ✅ Colunas `created_at` e `updated_at` ocultas por padrão
- ✅ Paginação com seleção de itens por página
- ✅ Visibilidade de colunas configurável
- ✅ Verificação de permissões (`edit`, `delete`)
- ✅ Dialog de confirmação para exclusão

---

## Componentes de Formulário

### Padrão de Formulário

Todos os formulários seguem a mesma estrutura:

```jsx
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

export function MeuForm({ row, onClose, onSave, loading = false }) {
  const safeRow = row || {};
  const [name, setName] = React.useState(safeRow.name || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { id: safeRow.id, name };
    if (onSave) onSave(payload);
    if (onClose) onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <FieldGroup>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="name">Nome</FieldLabel>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </Field>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            Salvar
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
```

**Props Padrão:**

| Prop      | Tipo       | Descrição                        |
| --------- | ---------- | -------------------------------- |
| `row`     | `object`   | Dados para edição (null = criar) |
| `onClose` | `function` | Callback para fechar o dialog    |
| `onSave`  | `function` | Callback com payload             |
| `loading` | `boolean`  | Estado de loading                |

### Formulários Existentes

| Arquivo               | Descrição                       |
| --------------------- | ------------------------------- |
| `department-form.jsx` | Formulário de departamentos     |
| `position-form.jsx`   | Formulário de cargos            |
| `user-form.jsx`       | Formulário de usuários          |
| `login-form.jsx`      | Formulário de login             |
| `profile-form.jsx`    | Formulário de perfil do usuário |
| `config-form.jsx`     | Formulário de configurações     |

### UserForm (Especial)

O formulário de usuários tem lógica especial para:

- Departamento filtra os cargos disponíveis
- Carrega posição inicial baseado no `position_id`

```jsx
// Carrega departamento baseado na posição
React.useEffect(() => {
  if (row?.position_id && positions.length) {
    const currentPosition = positions.find(
      (p) => String(p.id) === String(row.position_id)
    );
    if (currentPosition?.department_id) {
      setDepartmentId(String(currentPosition.department_id));
    }
  }
}, [row?.position_id, positions]);
```

---

## Componentes Especiais

### AccessButton

**Arquivo:** `components/buttons/access-button.jsx`

Botão para gerenciar permissões de um cargo.

```jsx
import { AccessButton } from '@/components/buttons/access-button';

<AccessButton
  positionId={row.id}
  onSaved={(items) => handlePermissionsSaved(row, items)}
/>;
```

**Props:**

| Prop         | Tipo       | Descrição                          |
| ------------ | ---------- | ---------------------------------- |
| `positionId` | `number`   | ID do cargo para editar permissões |
| `onSaved`    | `function` | Callback após salvar               |

**Funcionalidades:**

- Lista todas as telas (`screens`)
- Lista todas as permissões (`permissions`)
- Accordion com checkbox para cada combinação tela/permissão
- Campo de pesquisa para filtrar telas
- Badge mostrando quantidade de permissões por tela

---

### EmailVerificationBadge

**Arquivo:** `components/email-verification-badge.jsx`

Badge para exibir status de verificação de email.

```jsx
import { EmailVerificationBadge } from '@/components/email-verification-badge';

<EmailVerificationBadge confirmedAt={user.confirmed_at} />;
```

**Props:**

| Prop          | Tipo     | Descrição                          |
| ------------- | -------- | ---------------------------------- |
| `confirmedAt` | `string` | Timestamp de confirmação (ou null) |

**Exibição:**

- ✓ Verificado (verde) - quando `confirmedAt` existe
- ✗ Não verificado (cinza) - quando `confirmedAt` é null

---

### SettingsDialog

**Arquivo:** `components/settings-dialog.jsx`

Dialog de configurações globais (tema, etc).

```jsx
import { SettingsDialog } from '@/components/settings-dialog';

<SettingsDialog />;
```

---

### ModeToggle

**Arquivo:** `components/mode-toggle.jsx`

Toggle para alternar entre tema claro/escuro.

```jsx
import { ModeToggle } from '@/components/mode-toggle';

<ModeToggle />;
```

---

## Convenções de Criação

### Novo Formulário

1. Criar arquivo em `components/forms/[nome]-form.jsx`
2. Seguir estrutura padrão (props: row, onClose, onSave, loading)
3. Usar `FieldGroup`, `Field`, `FieldLabel` para campos
4. Grid responsivo: `grid-cols-1 sm:grid-cols-2`
5. Botões no final: Cancelar (outline) + Salvar (primary)

### Novo Botão Especial

1. Criar arquivo em `components/buttons/[nome]-button.jsx`
2. Usar Dialog se precisar de modal
3. Verificar permissões quando necessário
4. Usar toast para feedback

### Responsividade

- Mobile first: começar com layout de 1 coluna
- Breakpoints: `sm:` (640px), `md:` (768px), `lg:` (1024px)
- DataTable: usar `hideOnMobile: true` em colunas secundárias
- Forms: usar `grid-cols-1 sm:grid-cols-2`

---

_Documentação atualizada em: Março 2026_
