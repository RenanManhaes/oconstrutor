# O Construtor — Redesign

Cópia independente para reformulação do produto React/Vite/Supabase.

## Instalação

```sh
npm install
cp .env.example .env
npm run dev
```

Use um projeto Supabase de desenvolvimento separado. O `.env` original, que contém configuração de projeto, não foi transferido. A função `supabase/functions/seed-admin/index.ts` foi omitida por configurar um administrador com senha padrão e sem autorização adequada. Não adicione essa função novamente sem revisão de segurança. Os ativos PNG e `bun.lockb` não puderam ser transferidos automaticamente; suas substituições serão necessárias antes de publicar.

Nenhum dado ou usuário do Supabase foi migrado.
