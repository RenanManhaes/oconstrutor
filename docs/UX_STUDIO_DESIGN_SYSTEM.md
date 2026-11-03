# O Construtor — Sistema de design Studio (v1)

## Intenção de produto

Reformulação do front-end como produto digital de mentoria, não como um template de dashboard. A experiência privilegia continuidade, leitura, orientação e ações que o participante consegue executar sem procurar menus escondidos.

### Referências estudadas

- **Linear** (refresh de março/2026): hierarquia mais calma, contexto constante, foco no conteúdo da página e navegação secundária discreta — https://linear.app/now/behind-the-latest-design-refresh
- **Raycast**: velocidade, simplicidade, acesso direto e busca por comando — https://www.raycast.com/blog/a-fresh-look-and-feel
- **Apple HIG**: animação com propósito, reduzir movimentos quando necessário e feedbacks rápidos — https://developer.apple.com/design/human-interface-guidelines/motion

O produto usa princípios de clareza e consistência; não reproduz layouts de terceiros.

## Linguagem visual

| Sistema | Tratamento |
|---|---|
| Área de trabalho | Fundo grafite-pinho, superfícies foscas, bordas discretas e contraste elevado |
| Marketing e formulários públicos | Papel claro, verde profundo e cobre, grandes títulos editoriais |
| Tipografia | Manrope para estrutura e interface, DM Sans para texto, Instrument Serif somente para passagens editoriais |
| Cores de destaque | Cobre/areia no lugar do dourado saturado; verde controlado apenas em estados pertinentes |
| Cards | Sem efeitos de vidro excessivos, brilho neon, sombras decorativas ou gradientes aleatórios |
| Densidade | 8px como base, grades consistentes, espaçamento fluido conforme a área |
| Ícones | Lucide de traço fino, usados para reforçar leitura e ações |
| Feedback | Skeletons, mensagens de erro, vazio, concluído, aguardando e progresso real |

## Padrões de UX

1. **Ação primeiro**: dashboard do mentorado exibe o próximo encontro ainda não concluído.
2. **Prioridades administrativas**: indicadores têm destino clicável e atalhos que levam à tarefa.
3. **Navegação persistente**: mesma estrutura para administração e mentoria; barra lateral adaptativa.
4. **Busca global funcional**: `Ctrl/Cmd + K` abre a navegação rápida.
5. **Descoberta de conteúdo**: biblioteca e módulos agora aparecem na navegação do mentorado.
6. **Filtro reversível**: encontros e biblioteca têm filtros, busca e ação clara para limpar resultados.
7. **Estados explícitos**: carregamento, erro, indisponibilidade e sucesso apresentam a próxima ação apropriada.
8. **Acessibilidade**: labels visíveis, foco por teclado, semantic HTML, links de verdade e `prefers-reduced-motion`.

## Motion

- Entrada de conteúdo: 350–650ms; um deslocamento vertical curto, somente quando necessário.
- Hover de elementos acionáveis: 160–240ms; resposta discreta de cor, borda e posição.
- Progresso: valor real do banco, barra animada sem alterar o número exibido.
- Os efeitos são reduzidos/desativados para `prefers-reduced-motion: reduce`.
- Nenhum evento fica bloqueado esperando uma animação.

## Páginas contempladas

**Reconstrução:** landing, login, cadastro, redefinição de senha, inscrição em convite, shell do mentorado, shell administrativo, dashboard do mentorado, dashboard de gestão, jornada, encontros e biblioteca.

**Padronização do restante:** mentorados, gestão de encontros, financeiro, conteúdos administrativos, progresso, jornadas administrativas, convites, anúncios, configurações, módulos, perfil e comunicados.

As telas complexas restantes preservam seus formulários e operações existentes, mas seguem os tokens, a tipografia e a hierarquia de interface comuns.

## Restrições de migração

- Nenhuma mudança no repositório original.
- Nenhuma migration executada, nenhuma conta ou base de produção modificada.
- Projeto Supabase de desenvolvimento ainda precisa ser conectado (arquivo `.env.example`).
- `seed-admin` insegura permaneceu fora da cópia pública.
- Quatro arquivos SVG temporários substituem os assets binários indisponíveis na transferência; imagens originais autorizadas devem ser revisadas antes de lançamento.
- Compilação e tipos são verificados no GitHub Actions; uma aprovação visual em navegador real, fluxos autenticados e testes de responsividade ainda são necessários antes de publicação como produção.
- O `package-lock.json` herdado está defasado; CI faz `npm install` para validar. Regenerar e versionar lockfile antes de um deploy de produção reproduzível.

## Executar localmente

```bash
npm install
npm run dev
```

Configure `.env` a partir de `.env.example`. No Windows CMD: `copy .env.example .env` e edite as variáveis para um projeto Supabase isolado.

## Critérios de aceite para lançamento

- [ ] Build do Vite e TypeScript em verde
- [ ] Capturas de tela em desktop/tablet/mobile aprovadas visualmente
- [ ] Navegação, busca, login, cadastro e recuperação validados no navegador
- [ ] Encontro, biblioteca, mídia, pagamentos, usuários e convites validados com Supabase isolado
- [ ] Contraste/foco/teclado e movimento reduzido revisados
- [ ] Imagens finais revisadas e URLs/metadados publicados atualizados
