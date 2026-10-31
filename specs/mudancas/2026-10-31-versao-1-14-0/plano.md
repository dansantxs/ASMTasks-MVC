# Plano — Versão 1.14.0

- **Branch:** `chore/versao-1.14.0`, criada a partir da `main` **depois** de todas as mudanças da
  versão estarem nela. Só altera `Frontend/src/versao.js`.
- **Por que minor:** a versão tem funcionalidade nova (regra no topo do `versao.js`).
- Não é mudança de comportamento, então não tem `spec.md`; este plano lista o que o changelog
  precisa cobrir.

## O que entra no changelog

Uma linha por item, inclusive os fixes (regra do `versao.js`).

| Item | Origem | Situação em 2026-10-31 |
|---|---|---|
| Relatórios mostram a tarefa inteira; Dashboard credita como a Comissão; Agrupada ordenada pela elaboração | [historico-completo-da-tarefa](../2026-10-30-historico-completo-da-tarefa/spec.md) | na `main` |
| A a G (nome do cliente no Dashboard e no arrasto, modo cartões/lista, setor lembrado, data de nascimento opcional, Comissão sem "Aprovado por", excluir tarefa com histórico) | [ajustes-1-14-0](../2026-10-30-ajustes-1-14-0/spec.md) | na `main` |
| H. Busca por texto no Kanban | `origin/feat/kanban-busca-texto-tarefa` | parada |
| I. Filtros combinados no Kanban | `origin/feat/kanban-filtros-cascata` | parada |
| J. HTTPS na rede interna | `origin/claude/site-security-issue-112l9v` | parada |
| K. Backup no Google Drive | revert do `18990bd` | parado; a linha só vale com o rclone configurado no servidor |
| L. Linha do tempo mostra quem moveu | `fix/timeline-quem-moveu-etapa` | aguardando conferência |
| Cliente em negrito, data e ordem no Início e no Kanban | [inicio-kanban-cliente-negrito-data](../2026-10-31-inicio-kanban-cliente-negrito-data/spec.md) | spec |
| Histórico sem as concluídas por padrão | [rel-historico-nao-concluidas](../2026-10-31-rel-historico-nao-concluidas/spec.md) | spec |
| Comissão: Elaboração/Aprovação e horas no Resumo | [comissao-rotulos-resumo](../2026-10-31-comissao-rotulos-resumo/spec.md) | spec |
| Atendimentos com o nome do cliente da configuração | [atendimento-nome-cliente](../2026-10-31-atendimento-nome-cliente/spec.md) | spec |
| Tab na ordem da tela nos cadastros | [cadastros-ordem-tab](../2026-10-31-cadastros-ordem-tab/spec.md) | spec |

Ficam **fora** da 1.14.0, pausados por mexerem no banco: recorrência de atendimento e flag de
elaboração/setor de teste (e, por depender dela, o Reservado só com início na elaboração).
"Mover várias tarefas" e "atendimentos por dia da semana" entram se ficarem prontos a tempo.

A `origin/chore/changelog-1.11` é descartada: as entradas dela (busca e filtros do Kanban) são
reescritas aqui, nos itens H e I.

## Ordem de merge sugerida

1. Itens parados H, I, J, K e L (revisados contra a `main` atual).
2. `feat/inicio-kanban-cliente-negrito-data`, depois `fix/atendimento-nome-cliente` (helper).
3. `feat/rel-historico-nao-concluidas` e `feat/comissao-rotulos-resumo`.
4. `fix/cadastros-ordem-tab`, por último entre as mudanças de tela.
5. `chore/versao-1.14.0`.
