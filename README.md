# Âmbar — Biblioteca Digital Pessoal

Aplicação mobile-first em Next.js para leitura de PDFs sem login tradicional, com acesso por PIN local (hash SHA-256), acervo comum e prateleira pessoal.

## Funcionalidades implementadas (MVP)

- Entrada por PIN de 4 a 6 dígitos com hash SHA-256 no cliente
- Criação automática de biblioteca ao primeiro acesso
- Acervo comum com upload de PDF (até 15MB)
- Prateleira pessoal por hash do usuário (progresso, streak, meta semanal, highlights)
- Leitor full-screen com:
  - Modo lateral ou vertical
  - Tema claro, escuro e sépia
  - Barra de progresso por páginas
  - Highlights por cor e anotações
- PWA básica:
  - `manifest.webmanifest`
  - service worker customizado com cache de PDFs e estáticos

## Supabase configurado

Crie um arquivo `.env` com:

```env
DATABASE_URL="postgresql://postgres:SEU_PASSWORD@db.farmbzhpiyzskvyhcaug.supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://farmbzhpiyzskvyhcaug.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""
```

Schema Drizzle em `src/db/schema.ts`:

- `users` (pin hash)
- `books` (acervo compartilhado)
- `user_books` (prateleira pessoal, progresso, highlights e anotações)

Para sincronizar schema:

```bash
npm run db:push
```

## Rodando localmente

```bash
npm install
npm run dev
```

Abra em `http://localhost:3000`.
