import { useEffect, useMemo, useState } from "react";

/**
 * Pagina uma lista no client-side, expondo apenas os primeiros N itens
 * e permitindo carregar mais sob demanda. Quando `resetKey` muda
 * (ex: termo de busca, filtro ativo), a paginação volta para a primeira página.
 */
export function usePagination<T>(items: T[], pageSize = 24, resetKey?: unknown) {
  const [page, setPage] = useState(1);

  // Reset ao mudar a chave de filtro/busca
  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  const visible = useMemo(() => items.slice(0, page * pageSize), [items, page, pageSize]);
  const hasMore = visible.length < items.length;
  const loadMore = () => setPage((p) => p + 1);

  return { visible, hasMore, loadMore, total: items.length, shown: visible.length };
}
