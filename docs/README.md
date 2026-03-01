# Documentação - Prototype Template

Bem-vindo à documentação do Prototype Template. Este projeto é uma estrutura para prototipagem rápida de aplicações web com Next.js.

## Documentos Disponíveis

### [API.md](API.md)

Padrão de construção de APIs REST com banco de dados JSON.

**Conteúdo:**

- Estrutura de dados padrão
- Utilitário `lib/db.js`
- Operações CRUD
- Relações entre tabelas
- Helpers de resposta
- Template para novas APIs

### [PAGES.md](PAGES.md)

Padrão de páginas e comunicação com API.

**Conteúdo:**

- Estrutura de pastas
- Hooks `useApi` e `useCrud`
- Página CRUD padrão
- Componentes de página
- Páginas personalizadas
- Checklist para novas páginas

### [COMPONENTS.md](COMPONENTS.md)

Documentação de componentes reutilizáveis.

**Conteúdo:**

- Componentes de layout
- Componentes de página
- Componentes de navegação
- Componentes de formulário
- Componentes especiais

---

## Início Rápido

### Criar Nova Entidade CRUD

1. **Banco de Dados** - Criar `database/entities.json`:

   ```json
   []
   ```

2. **API** - Criar `app/api/entities/route.js`:

   ```javascript
   import * as db from '@/lib/db';
   const TABLE = 'entities';
   // ... (ver template em API.md)
   ```

3. **Formulário** - Criar `components/form/entity-form.jsx`

4. **Página** - Criar `app/(private)/config/entities/page.jsx`:

   ```jsx
   import { useCrud } from '@/hooks/use-crud';
   // ... (ver template em PAGES.md)
   ```

5. **Menu** - Adicionar em `components/app-sidebar.jsx`

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
│   ├── form/              # Formulários
│   ├── buttons/           # Botões especiais
│   └── ui/                # Componentes UI base
├── database/              # Arquivos JSON (banco de dados)
├── docs/                  # Documentação
├── hooks/                 # React Hooks customizados
├── lib/                   # Utilitários
└── public/                # Arquivos estáticos
```

---

## Arquivos Principais

| Arquivo                      | Descrição                    |
| ---------------------------- | ---------------------------- |
| `lib/db.js`                  | Utilitário de banco de dados |
| `hooks/use-api.js`           | Hook de comunicação com API  |
| `hooks/use-crud.js`          | Hook de gerenciamento CRUD   |
| `middleware.js`              | Proteção de rotas            |
| `components/app-sidebar.jsx` | Menu de navegação            |

---

## Tecnologias

- **Framework:** Next.js 14 (App Router)
- **UI:** Shadcn/ui + Tailwind CSS
- **Banco de Dados:** JSON Files
- **Ícones:** Lucide React

---

## Princípios do Projeto

1. **Praticidade** - Desenvolvimento rápido sem burocracia
2. **Consistência** - Padrões claros e documentados
3. **Eficiência** - Hooks e componentes reutilizáveis
4. **Simplicidade** - Sem complexidade desnecessária

---

_Documentação atualizada em: Março 2026_
