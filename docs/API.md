# Padrão de API - Prototype Template

Este documento define o padrão de construção de APIs para o projeto prototype-template. Siga estas diretrizes para manter consistência e facilitar o desenvolvimento.

## Índice

1. [Estrutura de Dados](#estrutura-de-dados)
2. [Utilitário de Banco de Dados](#utilitário-de-banco-de-dados)
3. [Padrão de API](#padrão-de-api)
4. [Operações CRUD](#operações-crud)
5. [Relações entre Tabelas](#relações-entre-tabelas)
6. [Exemplos Práticos](#exemplos-práticos)
7. [Criando uma Nova API](#criando-uma-nova-api)

---

## Estrutura de Dados

### Campos Obrigatórios

Toda tabela JSON **DEVE** conter os seguintes campos:

| Campo        | Tipo     | Descrição                             |
| ------------ | -------- | ------------------------------------- |
| `id`         | `number` | Identificador único auto-incrementado |
| `created_at` | `string` | Data de criação (ISO 8601)            |
| `updated_at` | `string` | Data da última atualização (ISO 8601) |

### Exemplo de Registro

```json
{
  "id": 1,
  "name": "Exemplo",
  "created_at": "2026-03-01T10:00:00.000Z",
  "updated_at": "2026-03-01T10:00:00.000Z"
}
```

### Localização dos Arquivos

- **Dados**: `database/*.json`
- **APIs**: `app/api/[recurso]/route.js`
- **Utilitários**: `lib/db.js`

---

## Utilitário de Banco de Dados

O arquivo `lib/db.js` centraliza todas as operações de banco de dados.

### Importação

```javascript
import * as db from '@/lib/db';
```

### Funções Disponíveis

#### Operações Básicas

| Função                  | Descrição                           |
| ----------------------- | ----------------------------------- |
| `db.read(table)`        | Lê todos os registros de uma tabela |
| `db.write(table, data)` | Escreve dados em uma tabela         |
| `db.getNextId(data)`    | Retorna o próximo ID disponível     |
| `db.timestamp()`        | Retorna timestamp atual ISO         |

#### Operações CRUD

| Função                           | Descrição                              |
| -------------------------------- | -------------------------------------- |
| `db.getAll(table, options)`      | Lista registros com filtros e relações |
| `db.getById(table, id, options)` | Busca registro por ID                  |
| `db.create(table, record)`       | Cria novo registro                     |
| `db.update(table, id, updates)`  | Atualiza registro existente            |
| `db.remove(table, id)`           | Remove registro por ID                 |

#### Operações em Lote

| Função                                 | Descrição                    |
| -------------------------------------- | ---------------------------- |
| `db.createMany(table, records)`        | Cria múltiplos registros     |
| `db.updateMany(table, where, updates)` | Atualiza múltiplos registros |
| `db.removeMany(table, where)`          | Remove múltiplos registros   |

#### Helpers de Relação

| Função                               | Descrição                             |
| ------------------------------------ | ------------------------------------- |
| `db.isReferenced(table, field, id)`  | Verifica se ID é referenciado         |
| `db.getReferences(table, field, id)` | Busca registros que referenciam um ID |

#### Helpers de Resposta

| Função                              | Descrição                 |
| ----------------------------------- | ------------------------- |
| `db.jsonResponse(data, status)`     | Resposta JSON             |
| `db.errorResponse(message, status)` | Resposta de erro          |
| `db.noContentResponse()`            | Resposta 204 No Content   |
| `db.parseQueryParams(req)`          | Parse de query parameters |

---

## Padrão de API

### Estrutura Básica

```javascript
import * as db from '@/lib/db';

const TABLE = 'nome_da_tabela';

// Definição de relações (opcional)
const RELATIONS = {
  campo: { table: 'tabela_relacionada', foreignKey: 'campo_id', type: 'one' },
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
| `DELETE` | Remover       | 204 No Content            |

---

## Operações CRUD

### GET - Listar e Buscar

```javascript
export async function GET(req) {
  const params = db.parseQueryParams(req);
  const { id, include, ...where } = params;

  // Buscar por ID
  if (id) {
    const record = await db.getById(TABLE, id, {
      include: include ? include.split(',') : [],
      relations: RELATIONS,
    });
    if (!record) return db.errorResponse('Não encontrado', 404);
    return db.jsonResponse(record);
  }

  // Listar com filtros
  const data = await db.getAll(TABLE, {
    where: Object.keys(where).length ? where : undefined,
    include: include ? include.split(',') : [],
    relations: RELATIONS,
  });

  return db.jsonResponse(data);
}
```

**Exemplos de uso:**

```bash
# Listar todos
GET /api/users

# Buscar por ID
GET /api/users?id=1

# Filtrar por campo
GET /api/users?position_id=2

# Incluir relações
GET /api/users?include=position
```

### POST - Criar

```javascript
export async function POST(req) {
  const body = await req.json();

  // Validações específicas (opcional)
  if (!body.name) {
    return db.errorResponse('Nome é obrigatório', 400);
  }

  const record = await db.create(TABLE, body);
  return db.jsonResponse(record, 201);
}
```

**Exemplo de uso:**

```bash
POST /api/users
Content-Type: application/json

{
  "name": "João",
  "email": "joao@example.com"
}
```

### PUT - Atualizar

```javascript
export async function PUT(req) {
  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) return db.errorResponse('ID é obrigatório', 400);

  const record = await db.update(TABLE, id, updates);
  if (!record) return db.errorResponse('Não encontrado', 404);

  return db.jsonResponse(record);
}
```

**Exemplo de uso:**

```bash
PUT /api/users
Content-Type: application/json

{
  "id": 1,
  "name": "João Silva"
}
```

### DELETE - Remover

```javascript
export async function DELETE(req) {
  const { id } = db.parseQueryParams(req);

  if (!id) return db.errorResponse('ID é obrigatório', 400);

  // Verificar dependências (opcional)
  const hasReferences = await db.isReferenced('orders', 'user_id', id);
  if (hasReferences) {
    return db.errorResponse(
      'Não é possível excluir - existem registros vinculados',
      400
    );
  }

  const deleted = await db.remove(TABLE, id);
  if (!deleted) return db.errorResponse('Não encontrado', 404);

  return db.noContentResponse();
}
```

**Exemplo de uso:**

```bash
DELETE /api/users?id=1
```

---

## Relações entre Tabelas

### Tipos de Relação

| Tipo      | Descrição            | Exemplo               |
| --------- | -------------------- | --------------------- |
| `one`     | Um-para-um           | Usuário → Cargo       |
| `many`    | Um-para-muitos (IDs) | Cargo → Departamentos |
| `reverse` | Relação reversa      | Departamento ← Cargos |

### Definindo Relações

```javascript
const RELATIONS = {
  // Um usuário TEM UM cargo (campo position_id → tabela positions)
  position: {
    table: 'positions',
    foreignKey: 'position_id',
    type: 'one',
  },

  // Um cargo PERTENCE A VÁRIOS departamentos (campo departments → tabela departments)
  departments: {
    table: 'departments',
    foreignKey: 'departments',
    type: 'many',
  },

  // Um departamento TEM VÁRIOS cargos (relação reversa)
  positions: {
    table: 'positions',
    referenceKey: 'departments',
    type: 'reverse',
  },
};
```

### Usando Relações nas Consultas

```javascript
// Buscar usuário com cargo incluído
const user = await db.getById('users', 1, {
  include: ['position'],
  relations: RELATIONS,
});

// Resultado:
{
  "id": 1,
  "name": "João",
  "position_id": 1,
  "position": {
    "id": 1,
    "name": "Administrador"
  }
}
```

### Verificando Referências Antes de Deletar

```javascript
// Verificar se departamento é usado por algum cargo
const hasReferences = await db.isReferenced(
  'positions',
  'departments',
  departmentId
);

if (hasReferences) {
  return db.errorResponse(
    'Não é possível excluir - existem cargos vinculados',
    400
  );
}
```

---

## Exemplos Práticos

### Exemplo Completo: API de Produtos

**1. Criar arquivo de dados: `database/products.json`**

```json
[]
```

**2. Criar API: `app/api/products/route.js`**

```javascript
import * as db from '@/lib/db';

const TABLE = 'products';

const RELATIONS = {
  category: { table: 'categories', foreignKey: 'category_id', type: 'one' },
};

export async function GET(req) {
  const params = db.parseQueryParams(req);
  const { id, include, ...where } = params;

  if (id) {
    const record = await db.getById(TABLE, id, {
      include: include ? include.split(',') : [],
      relations: RELATIONS,
    });
    if (!record) return db.errorResponse('Produto não encontrado', 404);
    return db.jsonResponse(record);
  }

  const data = await db.getAll(TABLE, {
    where: Object.keys(where).length ? where : undefined,
    include: include ? include.split(',') : [],
    relations: RELATIONS,
  });

  return db.jsonResponse(data);
}

export async function POST(req) {
  const body = await req.json();

  if (!body.name || !body.price) {
    return db.errorResponse('Nome e preço são obrigatórios', 400);
  }

  const record = await db.create(TABLE, body);
  return db.jsonResponse(record, 201);
}

export async function PUT(req) {
  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) return db.errorResponse('ID é obrigatório', 400);

  const record = await db.update(TABLE, id, updates);
  if (!record) return db.errorResponse('Produto não encontrado', 404);

  return db.jsonResponse(record);
}

export async function DELETE(req) {
  const { id } = db.parseQueryParams(req);

  if (!id) return db.errorResponse('ID é obrigatório', 400);

  const deleted = await db.remove(TABLE, id);
  if (!deleted) return db.errorResponse('Produto não encontrado', 404);

  return db.noContentResponse();
}
```

---

## Criando uma Nova API

### Checklist

1. [ ] Criar arquivo JSON em `database/[nome].json` com `[]`
2. [ ] Criar pasta `app/api/[nome]/`
3. [ ] Criar arquivo `route.js` com estrutura padrão
4. [ ] Definir relações se necessário
5. [ ] Implementar validações específicas
6. [ ] Adicionar verificação de referências no DELETE

### Template Rápido

Copie e cole este template para criar uma nova API:

```javascript
import * as db from '@/lib/db';

const TABLE = 'NOME_DA_TABELA';

// Defina relações conforme necessário
const RELATIONS = {
  // exemplo: { table: 'related', foreignKey: 'related_id', type: 'one' },
};

export async function GET(req) {
  const params = db.parseQueryParams(req);
  const { id, include, ...where } = params;

  if (id) {
    const record = await db.getById(TABLE, id, {
      include: include ? include.split(',') : [],
      relations: RELATIONS,
    });
    if (!record) return db.errorResponse('Registro não encontrado', 404);
    return db.jsonResponse(record);
  }

  const data = await db.getAll(TABLE, {
    where: Object.keys(where).length ? where : undefined,
    include: include ? include.split(',') : [],
    relations: RELATIONS,
  });

  return db.jsonResponse(data);
}

export async function POST(req) {
  const body = await req.json();
  const record = await db.create(TABLE, body);
  return db.jsonResponse(record, 201);
}

export async function PUT(req) {
  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) return db.errorResponse('ID é obrigatório', 400);

  const record = await db.update(TABLE, id, updates);
  if (!record) return db.errorResponse('Registro não encontrado', 404);

  return db.jsonResponse(record);
}

export async function DELETE(req) {
  const { id } = db.parseQueryParams(req);

  if (!id) return db.errorResponse('ID é obrigatório', 400);

  const deleted = await db.remove(TABLE, id);
  if (!deleted) return db.errorResponse('Registro não encontrado', 404);

  return db.noContentResponse();
}
```

---

## Boas Práticas

### ✅ Faça

- Use `db.isReferenced()` antes de deletar registros com dependências
- Mantenha nomes de tabelas em inglês e no plural (users, products, categories)
- Use `snake_case` para campos (position_id, created_at)
- Retorne mensagens de erro em português para o usuário final
- Valide campos obrigatórios antes de criar/atualizar

### ❌ Evite

- Não modifique `id` ou `created_at` em atualizações
- Não acesse arquivos JSON diretamente, use `lib/db.js`
- Não crie APIs sem os campos padrão (id, created_at, updated_at)
- Não delete registros sem verificar dependências

---

## Referência Rápida de Status HTTP

| Status | Significado | Quando usar          |
| ------ | ----------- | -------------------- |
| 200    | OK          | GET/PUT bem-sucedido |
| 201    | Created     | POST bem-sucedido    |
| 204    | No Content  | DELETE bem-sucedido  |
| 400    | Bad Request | Dados inválidos      |
| 404    | Not Found   | Registro não existe  |

---

## Consultas Frontend

### Usando fetch

```javascript
// GET - Listar todos
const users = await fetch('/api/users').then((r) => r.json());

// GET - Buscar por ID com relações
const user = await fetch('/api/users?id=1&include=position').then((r) =>
  r.json()
);

// POST - Criar
const newUser = await fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'João', email: 'joao@example.com' }),
}).then((r) => r.json());

// PUT - Atualizar
const updated = await fetch('/api/users', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ id: 1, name: 'João Silva' }),
}).then((r) => r.json());

// DELETE - Remover
await fetch('/api/users?id=1', { method: 'DELETE' });
```

---

_Documentação atualizada em: Março 2026_
