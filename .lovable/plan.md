# Plano: melhorar performance do app (foco: áudios lentos)

## Diagnóstico

Arquivos verificados no banco:
- 7 áudios + 1 vídeo armazenados no bucket público `media` (limite 200MB por arquivo)
- URLs servidas direto via `/storage/v1/object/public/...` (sem CDN otimizado para streaming progressivo)

Problemas reais encontrados:

1. **`MediaPlayerDialog.tsx`**: as tags `<audio>` / `<video>` usam `autoPlay` **sem `preload="metadata"`**. O navegador tenta baixar o arquivo inteiro antes de começar a tocar e **não há feedback visual** — o usuário vê o player aberto e nada acontecendo por vários segundos.
2. **Sem indicador de loading**: nenhum spinner enquanto o áudio carrega (eventos `waiting`, `loadstart`, `canplay` não tratados). Parece travado.
3. **Player carregado eagermente**: `MediaPlayerDialog` é importado estaticamente em `Materials.tsx` (cliente e admin) e em outras páginas → entra no bundle inicial mesmo quem nem vai usar.
4. **Storage sem cache longo**: arquivos do bucket `media` provavelmente sem `Cache-Control` agressivo → toda visita re-baixa.
5. **Landing (`Index.tsx`)**: faz RPC `get_next_public_invite` no mount sem cache (já vimos 4 chamadas iguais retornando `[]`). Pequeno, mas adiciona latência percebida.

## Mudanças

### 1. `src/components/MediaPlayerDialog.tsx` — prioridade máxima
- Adicionar `preload="auto"` nas tags `<audio>` e `<video>` (permite streaming progressivo: começa a tocar com os primeiros bytes em vez de esperar tudo).
- Adicionar estado `isBuffering` e tratar eventos `waiting`, `playing`, `canplay`, `loadstart`, `error`.
- Mostrar **spinner sobreposto ao ícone de Music** enquanto buffering, e mensagem amigável em caso de erro.
- Botão Play/Pause mostra spinner quando carregando.

### 2. Lazy-load do player
- Trocar `import MediaPlayerDialog from ...` por `const MediaPlayerDialog = lazy(() => import(...))` em:
  - `src/pages/client/Materials.tsx`
  - `src/pages/admin/Materials.tsx` (se usar)
  - `src/pages/client/ModuleDetail.tsx` (se usar)
- Envolver com `<Suspense fallback={null}>`. Resultado: bundle inicial menor → landing carrega mais rápido.

### 3. Cache HTTP nos arquivos de mídia (migration)
- Adicionar uma migration que ajusta os objetos existentes no bucket `media` para `cache_control = 'public, max-age=31536000, immutable'` (arquivos têm hash no nome, são imutáveis).
- Atualizar o código de upload (`Materials.tsx` admin) para passar `cacheControl: '31536000'` no `.upload()` para novos arquivos.
- **Resultado**: segunda visita do usuário não re-baixa o áudio — vem do cache do browser instantaneamente.

### 4. Landing — cachear RPC
- Trocar o `useEffect` cru em `Index.tsx` por `useQuery` (já temos React Query) com `staleTime: 5 * 60 * 1000`. Evita refetch a cada navegação.

### 5. (opcional, baixo custo) Compressão de áudio
- Mencionar ao usuário: arquivos `.mpeg` e `.mp3` antigos podem estar com bitrate alto (>192kbps). Para falas/podcasts, 96-128kbps mono já é excelente e reduz o tamanho em 50-70%. Não vou re-encodar automaticamente — só sinalizo.

## O que NÃO vou fazer
- Não vou trocar o storage por outro provider/CDN (overkill).
- Não vou implementar streaming HLS (complexidade alta para o ganho).
- Não vou mexer em `MediaPlayerDialog` além do necessário pra performance/UX.

## Resultado esperado
- Áudio começa a tocar em ~1-2s (em vez de esperar download completo).
- Usuário vê spinner enquanto carrega → não parece travado.
- Bundle inicial da landing menor (sem código do player) → carregamento mais rápido para visitantes.
- Segunda reprodução do mesmo áudio: instantânea (cache de 1 ano).
- RPC da landing chamado 1x por sessão em vez de a cada montagem.
