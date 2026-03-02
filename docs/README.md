# Documentação - Prototype Template

Bem-vindo à documentação do Prototype Template. Este projeto é uma estrutura para prototipagem rápida de aplicações web com Next.js e Supabase.

## Documentos Disponíveis

### [API.md](API.md)

Padrão de construção de APIs REST com Supabase.

**Conteúdo:**

- Utilitário `lib/supabase-db.js`
- Operações CRUD
- Definição de relações
- Tratamento de erros
- Template para novas APIs

### [PAGES.md](PAGES.md)

Padrão de páginas e comunicação com API.

**Conteúdo:**

- Estrutura de pastas
- Hooks `useApi` e `useCrud`
- Página CRUD com DataTable
- Sistema de permissões
- Checklist para novas páginas

### [COMPONENTS.md](COMPONENTS.md)

Documentação de componentes reutilizáveis.

**Conteúdo:**

- Componentes de layout (AppSidebar, SiteHeader)
- Componentes de página (PageHeader, DataTable)
- Componentes de formulário
- Componentes especiais (AccessButton)

### [DATABASE.md](DATABASE.md)

Estrutura do banco de dados Supabase.

**Conteúdo:**

- Esquema de tabelas (profile, positions, departments, etc.)
- Relacionamentos e Foreign Keys
- Triggers (handle_new_user, sync_user_changes)
- Políticas RLS
- Convenções e Seed Data

---

## Início Rápido

### Criar Nova Entidade CRUD

1. **Tabela no Supabase** - Criar via SQL:

   ```sql
   CREATE TABLE entities (
     id SERIAL PRIMARY KEY,
     name TEXT NOT NULL,
     created_at TIMESTAMPTZ DEFAULT now(),
     updated_at TIMESTAMPTZ DEFAULT now()
   );
   ```

2. **Tela de Permissão** - Registrar na tabela `screens`:

   ```sql
   INSERT INTO screens (name, key) VALUES ('Entidades', 'entities');
   ```

3. **API** - Criar `app/api/entities/route.js`:

   ```javascript
   import * as db from '@/lib/supabase-db';
   const TABLE = 'entities';
   // ... (ver template em API.md)
   ```

4. **Formulário** - Criar `components/forms/entity-form.jsx`

5. **Página** - Criar `app/(private)/config/entities/page.jsx`:

   ```jsx
   import { useCrud } from '@/hooks/use-crud';
   // ... (ver template em PAGES.md)
   ```

6. **Menu** - Adicionar em `components/app-sidebar.jsx`

---

## Estrutura do Projeto

```
prototype-template/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Páginas de autenticação
│   ├── (private)/         # Páginas protegidas
│   ├── (public)/          # Páginas públicas
│   └── api/               # Endpoints REST
├── components/            # Componentes React
│   ├── forms/             # Formulários
│   ├── buttons/           # Botões especiais
│   └── ui/                # Componentes UI base
├── docs/                  # Documentação
├── hooks/                 # React Hooks customizados
├── lib/                   # Utilitários
│   └── supabase/          # Clientes Supabase
└── public/                # Arquivos estáticos
```

---

## Arquivos Principais

| Arquivo                      | Descrição                         |
| ---------------------------- | --------------------------------- |
| `lib/supabase-db.js`         | Utilitário de banco de dados      |
| `lib/supabase/server.js`     | Cliente Supabase (server-side)    |
| `lib/supabase/client.js`     | Cliente Supabase (client-side)    |
| `lib/error-handler.js`       | Tratamento de erros Supabase      |
| `hooks/use-api.js`           | Hook de comunicação com API       |
| `hooks/use-crud.js`          | Hook de gerenciamento CRUD        |
| `hooks/use-permission.js`    | Hook de verificação de permissões |
| `middleware.js`              | Proteção de rotas                 |
| `components/app-sidebar.jsx` | Menu de navegação                 |

---

## Tecnologias

- **Framework:** Next.js 16 (App Router + Turbopack)
- **UI:** Shadcn/ui + Tailwind CSS
- **Banco de Dados:** Supabase (PostgreSQL)
- **Autenticação:** Supabase Auth
- **Ícones:** Lucide React

---

## Princípios do Projeto

1. **Praticidade** - Desenvolvimento rápido sem burocracia
2. **Consistência** - Padrões claros e documentados
3. **Eficiência** - Hooks e componentes reutilizáveis
4. **Simplicidade** - Sem complexidade desnecessária

---

_Documentação atualizada em: Março 2026_
