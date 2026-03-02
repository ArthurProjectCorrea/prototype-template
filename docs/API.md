# Padrão de API - Prototype Template

Este documento define o padrão de construção de APIs para o projeto prototype-template usando **Supabase**.

## Índice

1. [Estrutura de Dados](#estrutura-de-dados)
2. [Utilitário de Banco de Dados](#utilitário-de-banco-de-dados)
3. [Padrão de API CRUD](#padrão-de-api-crud)
4. [Handler de Erros](#handler-de-erros)
5. [APIs Especiais](#apis-especiais)
6. [Criando uma Nova API](#criando-uma-nova-api)

---

## Estrutura de Dados

### Campos Padrão (Obrigatórios)

Toda tabela Supabase **DEVE** conter os seguintes campos:

| Campo        | Tipo                       | Descrição                  |
| ------------ | -------------------------- | -------------------------- |
| `id`         | `BIGSERIAL` ou `UUID`      | Identificador único        |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | Data de criação            |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | Data da última atualização |

### Localização dos Arquivos

```
app/api/[recurso]/route.js   → API Route Handler
lib/supabase-db.js           → Utilitários CRUD
lib/supabase/server.js       → Cliente Supabase (Server)
lib/error-handler.js         → Handler de erros centralizado
```

---

## Utilitário de Banco de Dados

O arquivo `lib/supabase-db.js` centraliza todas as operações de banco de dados.

### Importação

```javascript
import * as db from '@/lib/supabase-db';
```

### Funções Disponíveis

#### Operações CRUD

| Função                           | Descrição                              |
| -------------------------------- | -------------------------------------- |
| `db.getAll(table, options)`      | Lista registros com filtros e relações |
| `db.getById(table, id, options)` | Busca registro por ID                  |
| `db.create(table, data)`         | Cria novo registro                     |
| `db.update(table, id, updates)`  | Atualiza registro existente            |
| `db.remove(table, id)`           | Remove registro por ID                 |
| `db.createMany(table, records)`  | Cria múltiplos registros               |

#### Helpers de Resposta

| Função                              | Descrição                 |
| ----------------------------------- | ------------------------- |
| `db.jsonResponse(data, status)`     | Resposta JSON             |
| `db.errorResponse(message, status)` | Resposta de erro          |
| `db.parseQueryParams(req)`          | Parse de query parameters |

---

## Padrão de API CRUD

### Template Básico

```javascript
import * as db from '@/lib/supabase-db';
import { handleSupabaseError } from '@/lib/error-handler';

const TABLE = 'nome_tabela';

// Definição de relações (opcional)
const RELATIONS = {
  campo: { table: 'tabela_rel', foreignKey: 'campo_id', type: 'one' },
};

export async function GET(req) {
  /* ... */
}
export async function POST(req) {
  /* ... */
}
export async function PUT(req) {
  /* ... */
}
export async function DELETE(req) {
  /* ... */
}
```

### Métodos HTTP

| Método   | Ação          | Retorno                   |
| -------- | ------------- | ------------------------- |
| `GET`    | Listar/Buscar | 200 + dados               |
| `POST`   | Criar         | 201 + registro criado     |
| `PUT`    | Atualizar     | 200 + registro atualizado |
| `DELETE` | Remover       | 200 + { success: true }   |

---

### GET - Listar e Buscar

```javascript
export async function GET(req) {
  const params = db.parseQueryParams(req);
  const { id, include, ...where } = params;

  try {
    // Buscar por ID
    if (id) {
      const record = await db.getById(TABLE, id, {
        include: include ? include.split(',') : [],
        relations: RELATIONS,
      });
      if (!record) return db.errorResponse('Não encontrado', 404);
      return db.jsonResponse(record);
    }

    // Listar todos (com filtros opcionais)
    const data = await db.getAll(TABLE, {
      where: Object.keys(where).length ? where : undefined,
      include: include ? include.split(',') : [],
      relations: RELATIONS,
    });

    return db.jsonResponse(data);
  } catch (error) {
    const errorMsg = handleSupabaseError(error, 'tabela.getAll');
    return db.errorResponse(errorMsg, 500);
  }
}
```

**Exemplos de uso:**

```bash
# Listar todos
GET /api/departments

# Buscar por ID
GET /api/departments?id=1

# Filtrar por campo
GET /api/positions?department_id=2

# Incluir relações
GET /api/positions?include=department
```

---

### POST - Criar

```javascript
export async function POST(req) {
  const body = await req.json();

  // Validações (opcional)
  if (!body.name) {
    return db.errorResponse('Nome é obrigatório', 400);
  }

  try {
    const record = await db.create(TABLE, body);
    return db.jsonResponse(record, 201);
  } catch (error) {
    const errorMsg = handleSupabaseError(error, 'tabela.create');
    return db.errorResponse(errorMsg, 500);
  }
}
```

---

### PUT - Atualizar

```javascript
export async function PUT(req) {
  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) return db.errorResponse('ID é obrigatório', 400);

  try {
    const record = await db.update(TABLE, id, updates);
    if (!record) return db.errorResponse('Não encontrado', 404);
    return db.jsonResponse(record);
  } catch (error) {
    const errorMsg = handleSupabaseError(error, 'tabela.update');
    return db.errorResponse(errorMsg, 500);
  }
}
```

---

### DELETE - Remover

```javascript
export async function DELETE(req) {
  const { id } = db.parseQueryParams(req);

  if (!id) return db.errorResponse('ID é obrigatório', 400);

  try {
    await db.remove(TABLE, id);
    return db.jsonResponse({ success: true });
  } catch (error) {
    const errorMsg = handleSupabaseError(error, 'tabela.delete');
    return db.errorResponse(errorMsg, 500);
  }
}
```

---

## Handler de Erros

### Importação

```javascript
import { handleSupabaseError } from '@/lib/error-handler';
```

### Uso

```javascript
try {
  // operação
} catch (error) {
  const errorMsg = handleSupabaseError(error, 'contexto.operacao');
  return db.errorResponse(errorMsg, 500);
}
```

O handler traduz erros do Supabase para mensagens amigáveis em português.

---

## APIs Especiais

### API de Usuários (users)

A API de usuários tem lógica especial para integração com **Supabase Auth**:

```javascript
import { createClient, createAdminClient } from '@/lib/supabase/server';

// POST - Criar usuário
// 1. Usa adminClient.auth.admin.createUser() para criar no Auth
// 2. Trigger automático cria profile com position_id do metadata

// DELETE - Remover usuário
// 1. Usa adminClient.auth.admin.deleteUser() para remover do Auth
// 2. Cascade deleta profile automaticamente
```

### API de Cargos (positions)

A API de cargos permite gerenciar permissões de acesso:

```javascript
// PUT - Atualizar cargo
// Campo especial "permissions" atualiza tabela "access"
const { id, permissions, ...updates } = body;

if (permissions) {
  // Remove acessos antigos
  await supabase.from('access').delete().eq('position_id', id);

  // Cria novos acessos
  for (const perm of permissions) {
    const { screen_key, permission_key } = perm;
    // Busca IDs e insere em access
  }
}
```

---

## Criando uma Nova API

### 1. Criar arquivo

```
app/api/[nome]/route.js
```

### 2. Copiar template

```javascript
import * as db from '@/lib/supabase-db';
import { handleSupabaseError } from '@/lib/error-handler';

const TABLE = 'nome_tabela';

const RELATIONS = {
  // Definir relações se necessário
};

export async function GET(req) {
  const params = db.parseQueryParams(req);
  const { id, include, ...where } = params;

  try {
    if (id) {
      const record = await db.getById(TABLE, id, {
        include: include ? include.split(',') : [],
        relations: RELATIONS,
      });
      if (!record) return db.errorResponse('Não encontrado', 404);
      return db.jsonResponse(record);
    }

    const data = await db.getAll(TABLE, {
      where: Object.keys(where).length ? where : undefined,
      include: include ? include.split(',') : [],
      relations: RELATIONS,
    });

    return db.jsonResponse(data);
  } catch (error) {
    const errorMsg = handleSupabaseError(error, `${TABLE}.getAll`);
    return db.errorResponse(errorMsg, 500);
  }
}

export async function POST(req) {
  const body = await req.json();

  try {
    const record = await db.create(TABLE, body);
    return db.jsonResponse(record, 201);
  } catch (error) {
    const errorMsg = handleSupabaseError(error, `${TABLE}.create`);
    return db.errorResponse(errorMsg, 500);
  }
}

export async function PUT(req) {
  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) return db.errorResponse('ID é obrigatório', 400);

  try {
    const record = await db.update(TABLE, id, updates);
    if (!record) return db.errorResponse('Não encontrado', 404);
    return db.jsonResponse(record);
  } catch (error) {
    const errorMsg = handleSupabaseError(error, `${TABLE}.update`);
    return db.errorResponse(errorMsg, 500);
  }
}

export async function DELETE(req) {
  const { id } = db.parseQueryParams(req);

  if (!id) return db.errorResponse('ID é obrigatório', 400);

  try {
    await db.remove(TABLE, id);
    return db.jsonResponse({ success: true });
  } catch (error) {
    const errorMsg = handleSupabaseError(error, `${TABLE}.delete`);
    return db.errorResponse(errorMsg, 500);
  }
}
```

### 3. Criar tabela no Supabase

Ver [DATABASE.md](./DATABASE.md) para padrões de criação de tabelas.

### 4. Registrar tela (se CRUD visível)

Adicionar registro em `screens` para controle de permissões:

```sql
INSERT INTO screens (name, key) VALUES ('Nome Tela', 'chave_tela');
```

---

## Convenções

### Nomenclatura

- **Tabelas**: snake_case, plural (`departments`, `positions`)
- **APIs**: mesmo nome da tabela (`/api/departments`)
- **Campos FK**: `nome_tabela_id` singular (`department_id`, `position_id`)

### Respostas

- **Sucesso**: Retornar objeto/array diretamente
- **Erro**: Retornar `{ error: 'mensagem' }`
- **Delete**: Retornar `{ success: true }`

### Validações

- Validar campos obrigatórios no início do handler
- Retornar 400 para erros de validação
- Retornar 404 para registros não encontrados
- Retornar 500 para erros inesperados

---

_Documentação atualizada em: Março 2026_
