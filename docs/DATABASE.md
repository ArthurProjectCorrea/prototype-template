# Estrutura de Banco de Dados - Prototype Template

Este documento descreve a estrutura do banco de dados Supabase utilizado pelo projeto.

## Índice

1. [Visão Geral](#visão-geral)
2. [Tabelas](#tabelas)
3. [Relacionamentos](#relacionamentos)
4. [Triggers](#triggers)
5. [Políticas RLS](#políticas-rls)
6. [Convenções](#convenções)

---

## Visão Geral

O projeto utiliza **Supabase** (PostgreSQL) com as seguintes características:

- **Autenticação**: Supabase Auth (tabela `auth.users`)
- **Perfis**: Tabela `profile` sincronizada com `auth.users` via trigger
- **Permissões**: Sistema de acesso baseado em cargo → tela → permissão

### Diagrama de Relacionamentos

```
auth.users (Supabase Auth)
    │
    └──► profile (Perfil do usuário)
              │
              └──► positions (Cargo)
                        │
                        ├──► departments (Departamento)
                        │
                        └──► access (Permissões)
                                  │
                                  ├──► screens (Telas)
                                  │
                                  └──► permissions (Tipos de permissão)
```

---

## Tabelas

### profile

Perfis de usuário sincronizados com `auth.users`.

```sql
CREATE TABLE profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  position_id INTEGER REFERENCES positions(id),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

| Coluna         | Tipo          | Descrição                           |
| -------------- | ------------- | ----------------------------------- |
| `id`           | `UUID`        | ID do usuário (mesmo do auth.users) |
| `name`         | `TEXT`        | Nome completo                       |
| `email`        | `TEXT`        | Email único                         |
| `avatar_url`   | `TEXT`        | URL da foto de perfil               |
| `position_id`  | `INTEGER`     | FK para cargo                       |
| `confirmed_at` | `TIMESTAMPTZ` | Data de confirmação de email        |
| `created_at`   | `TIMESTAMPTZ` | Data de criação                     |
| `updated_at`   | `TIMESTAMPTZ` | Data de última atualização          |

---

### departments

Departamentos organizacionais.

```sql
CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

| Coluna        | Tipo          | Descrição                  |
| ------------- | ------------- | -------------------------- |
| `id`          | `SERIAL`      | ID auto-incrementado       |
| `name`        | `TEXT`        | Nome do departamento       |
| `description` | `TEXT`        | Descrição (opcional)       |
| `created_at`  | `TIMESTAMPTZ` | Data de criação            |
| `updated_at`  | `TIMESTAMPTZ` | Data de última atualização |

---

### positions

Cargos/funções dentro da organização.

```sql
CREATE TABLE positions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  department_id INTEGER REFERENCES departments(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

| Coluna          | Tipo          | Descrição                       |
| --------------- | ------------- | ------------------------------- |
| `id`            | `SERIAL`      | ID auto-incrementado            |
| `name`          | `TEXT`        | Nome do cargo                   |
| `department_id` | `INTEGER`     | FK para departamento (opcional) |
| `created_at`    | `TIMESTAMPTZ` | Data de criação                 |
| `updated_at`    | `TIMESTAMPTZ` | Data de última atualização      |

---

### screens

Telas/módulos da aplicação para controle de acesso.

```sql
CREATE TABLE screens (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  key TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

| Coluna        | Tipo          | Descrição                         |
| ------------- | ------------- | --------------------------------- |
| `id`          | `SERIAL`      | ID auto-incrementado              |
| `name`        | `TEXT`        | Nome amigável da tela             |
| `key`         | `TEXT`        | Identificador único (ex: `users`) |
| `description` | `TEXT`        | Descrição da tela (opcional)      |
| `created_at`  | `TIMESTAMPTZ` | Data de criação                   |
| `updated_at`  | `TIMESTAMPTZ` | Data de última atualização        |

**Telas padrão:**

| Key           | Nome          | Descrição                      |
| ------------- | ------------- | ------------------------------ |
| `users`       | Usuários      | Gerenciamento de usuários      |
| `positions`   | Cargos        | Gerenciamento de cargos        |
| `departments` | Departamentos | Gerenciamento de departamentos |

---

### permissions

Tipos de permissão disponíveis.

```sql
CREATE TABLE permissions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  key TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

| Coluna        | Tipo          | Descrição                        |
| ------------- | ------------- | -------------------------------- |
| `id`          | `SERIAL`      | ID auto-incrementado             |
| `name`        | `TEXT`        | Nome amigável                    |
| `key`         | `TEXT`        | Identificador único (ex: `view`) |
| `description` | `TEXT`        | Descrição (opcional)             |
| `created_at`  | `TIMESTAMPTZ` | Data de criação                  |
| `updated_at`  | `TIMESTAMPTZ` | Data de última atualização       |

**Permissões padrão:**

| Key      | Nome       | Descrição                           |
| -------- | ---------- | ----------------------------------- |
| `view`   | Visualizar | Pode visualizar dados               |
| `edit`   | Editar     | Pode criar e editar dados           |
| `delete` | Excluir    | Pode excluir dados                  |
| `export` | Exportar   | Pode exportar dados                 |
| `grant`  | Conceder   | Pode gerenciar permissões de acesso |

---

### access

Tabela de junção para permissões (cargo → tela → permissão).

```sql
CREATE TABLE access (
  id SERIAL PRIMARY KEY,
  position_id INTEGER NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
  screen_id INTEGER NOT NULL REFERENCES screens(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(position_id, screen_id, permission_id)
);
```

| Coluna          | Tipo          | Descrição                  |
| --------------- | ------------- | -------------------------- |
| `id`            | `SERIAL`      | ID auto-incrementado       |
| `position_id`   | `INTEGER`     | FK para cargo              |
| `screen_id`     | `INTEGER`     | FK para tela               |
| `permission_id` | `INTEGER`     | FK para tipo de permissão  |
| `created_at`    | `TIMESTAMPTZ` | Data de criação            |
| `updated_at`    | `TIMESTAMPTZ` | Data de última atualização |

**Constraint:** Combinação única de `position_id + screen_id + permission_id`.

---

## Relacionamentos

### Definições no Código

Os relacionamentos são definidos nas rotas API usando o objeto `RELATIONS`:

```javascript
// app/api/positions/route.js
const RELATIONS = {
  department: {
    table: 'departments',
    foreignKey: 'department_id',
    type: 'one',
  },
  profile: { table: 'profile', referenceKey: 'position_id', type: 'reverse' },
  access: { table: 'access', referenceKey: 'position_id', type: 'reverse' },
};
```

### Tipos de Relação

| Tipo      | Descrição                                   |
| --------- | ------------------------------------------- |
| `one`     | Many-to-one (FK está na tabela atual)       |
| `many`    | One-to-many (FK está na tabela relacionada) |
| `reverse` | Relação reversa (busca onde FK = id atual)  |

---

## Triggers

### handle_new_user

Cria automaticamente um registro em `profile` quando um usuário é criado no Auth.

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profile (id, email, name, position_id, confirmed_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    (NEW.raw_user_meta_data->>'position_id')::INTEGER,
    NEW.confirmed_at
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### sync_user_changes

Sincroniza alterações do `auth.users` para `profile`.

```sql
CREATE OR REPLACE FUNCTION sync_user_changes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profile
  SET
    email = NEW.email,
    confirmed_at = NEW.confirmed_at,
    updated_at = now()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION sync_user_changes();
```

### Cascade Delete

Quando um usuário é deletado do Auth, o `profile` é removido automaticamente via `ON DELETE CASCADE`.

---

## Políticas RLS

Row Level Security (RLS) deve ser habilitado em todas as tabelas públicas.

### Habilitar RLS

```sql
ALTER TABLE profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE screens ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE access ENABLE ROW LEVEL SECURITY;
```

### Função de Verificação de Permissão

Função auxiliar para verificar permissões nas políticas RLS:

```sql
CREATE OR REPLACE FUNCTION public.has_permission(screen_key TEXT, permission_key TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_position_id BIGINT;
  has_access BOOLEAN;
BEGIN
  SELECT position_id INTO user_position_id
  FROM public.profile WHERE id = auth.uid();

  IF user_position_id IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.access a
    JOIN public.screens s ON s.id = a.screen_id
    JOIN public.permissions p ON p.id = a.permission_id
    WHERE a.position_id = user_position_id
      AND s.key = screen_key
      AND p.key = permission_key
  ) INTO has_access;

  RETURN has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

### Políticas do Profile

```sql
-- Visualizar: todos autenticados podem ver todos os profiles
CREATE POLICY "Users can view all profiles" ON profile
  FOR SELECT TO authenticated USING (true);

-- Editar: próprio perfil OU permissão 'edit' na tela 'users'
CREATE POLICY "Users can update profiles" ON profile
  FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.has_permission('users', 'edit'));

-- Inserir: próprio perfil OU permissão 'edit' na tela 'users'
CREATE POLICY "Users with permission can insert profiles" ON profile
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id OR public.has_permission('users', 'edit'));

-- Deletar: próprio perfil OU permissão 'delete' na tela 'users'
CREATE POLICY "Users with permission can delete profiles" ON profile
  FOR DELETE TO authenticated
  USING (auth.uid() = id OR public.has_permission('users', 'delete'));
```

### Políticas de Tabelas de Configuração

```sql
-- Tabelas de configuração: leitura e escrita para autenticados
CREATE POLICY "Authenticated can read departments" ON departments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can insert departments" ON departments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated can update departments" ON departments
  FOR UPDATE USING (true);

CREATE POLICY "Authenticated can delete departments" ON departments
  FOR DELETE USING (true);

-- Repetir padrão para: positions, access
-- Somente leitura para: screens, permissions
```

**Nota:** Operações de escrita em `auth.users` (criar/deletar usuários) devem usar `service_role` key (admin client) para bypass de RLS.

---

## Convenções

### Campos Padrão

Todas as tabelas devem ter:

```sql
created_at TIMESTAMPTZ DEFAULT now(),
updated_at TIMESTAMPTZ DEFAULT now()
```

### Nomenclatura

| Convenção            | Exemplo            |
| -------------------- | ------------------ |
| Tabelas              | snake_case, plural |
| Colunas              | snake_case         |
| FKs                  | `{tabela}_id`      |
| PKs                  | `id`               |
| Timestamps           | `_at` suffix       |
| Keys identificadoras | Campo `key` único  |

### IDs

- `profile.id`: UUID (link com auth.users)
- Outras tabelas: SERIAL (auto-incrementado)

### Timestamps

- Sempre usar `TIMESTAMPTZ` (com timezone)
- `created_at`: Definido automaticamente no create
- `updated_at`: Atualizado em toda operação de update

---

## Seed Data

### Permissões Iniciais

```sql
INSERT INTO permissions (name, key) VALUES
  ('Visualizar', 'view'),
  ('Editar', 'edit'),
  ('Excluir', 'delete'),
  ('Exportar', 'export'),
  ('Conceder', 'grant');
```

### Telas Iniciais

```sql
INSERT INTO screens (name, key) VALUES
  ('Usuários', 'users'),
  ('Cargos', 'positions'),
  ('Departamentos', 'departments');
```

### Cargo Admin (todas as permissões)

```sql
-- Criar departamento e cargo
INSERT INTO departments (name) VALUES ('Administração');
INSERT INTO positions (name, department_id) VALUES ('Administrador', 1);

-- Conceder todas as permissões em todas as telas
INSERT INTO access (position_id, screen_id, permission_id)
SELECT 1, s.id, p.id
FROM screens s, permissions p;
```

---

_Documentação atualizada em: Março 2026_
