# Portal CPA

Painel da Comissão Própria de Avaliação: metodologia, cronograma, avaliações, resultados e ações.

## Rodar localmente

```bash
bun install
bun run dev
```

Crie um `.env` com:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
```

## Publicar no GitHub Pages

1. Suba o projeto para um repositório no GitHub (branch `main`).
2. Em **Settings → Pages**, defina *Source* = **GitHub Actions**.
3. Em **Settings → Secrets and variables → Actions**, cadastre os secrets
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` e `VITE_SUPABASE_PROJECT_ID`
   (são chaves públicas, protegidas por RLS no banco).
4. O workflow `.github/workflows/deploy.yml` faz o build com `BASE_PATH=/<repo>/`,
   gera o `404.html` (fallback de rotas SPA) e publica automaticamente a cada push.

## Acesso ao sistema

- `/` — página pública (apresentação, metodologia e cronograma)
- `/auth` — login e solicitação de acesso
- `/painel` — painel administrativo (exige login e acesso liberado)

O usuário `denise.santos@uniriosead.com` é o administrador e libera o acesso dos
demais usuários na aba **Acessos** do painel.
