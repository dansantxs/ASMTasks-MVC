# Plano — Versão 1.14.0

- **Branch:** `chore/versao-1.14.0`, criada a partir da `main` depois de todas as mudanças da versão
  estarem nela. Só altera `Frontend/src/versao.js`.
- **Por que minor:** a versão tem funcionalidade nova (regra no topo do `versao.js`).
- **Banco de dados:** nenhuma alteração. Atualizar o servidor é só subir o backend e o frontend.
- Não é mudança de comportamento, então não tem `spec.md`; este plano lista o que o changelog cobre.

## O que entra (situação em 2026-11-03: tudo na `main`)

| Item | Origem |
|---|---|
| Relatórios mostram a tarefa inteira; Dashboard credita como a Comissão; Agrupada ordenada pela elaboração | [historico-completo-da-tarefa](../2026-10-30-historico-completo-da-tarefa/spec.md) |
| A a G (nome do cliente no Dashboard e no arrasto, modo cartões/lista, setor lembrado, data de nascimento opcional, Comissão sem "Aprovado por", excluir tarefa com histórico) | [ajustes-1-14-0](../2026-10-30-ajustes-1-14-0/spec.md) |
| I. Filtros combinados no Kanban | `origin/feat/kanban-filtros-cascata` |
| Cliente em negrito, data de lançamento e ordem no Início e no Kanban | [inicio-kanban-cliente-negrito-data](../2026-10-31-inicio-kanban-cliente-negrito-data/spec.md) |
| Atendimentos com o nome do cliente da configuração | [atendimento-nome-cliente](../2026-10-31-atendimento-nome-cliente/spec.md) |
| Histórico de Tarefas sem as concluídas por padrão | [rel-historico-nao-concluidas](../2026-10-31-rel-historico-nao-concluidas/spec.md) |
| Comissão: Elaboração/Aprovação e horas no Resumo | [comissao-rotulos-resumo](../2026-10-31-comissao-rotulos-resumo/spec.md) |
| Linha do tempo da tarefa em frases (inclui o L, quem moveu) | [linha-do-tempo-legivel](../2026-11-03-linha-do-tempo-legivel/spec.md) |
| Mover várias tarefas no Kanban | [kanban-mover-varias-tarefas](../2026-10-30-kanban-mover-varias-tarefas/spec.md) |

**Não entra:** a busca por texto no Kanban (H), que entrou na `main` e foi retirada antes da versão
(Daniel, 2026-11-03). A `origin/chore/changelog-1.11` foi descartada.

## Fica para a 1.15.0 (decisão de Daniel, 2026-11-03)

- Gráfico de tarefas concluídas nos últimos 6 meses e zoom nos anexos (specs em rascunho).
- Atendimentos por dia da semana (spec e plano aprovados).
- Ordem do Tab nos formulários (spec e plano aprovados; falta reproduzir o problema).
- Mudanças que mexem no banco ou no servidor: flag de elaboração e setor de teste, Reservado só com
  início na elaboração, recorrência de atendimento, HTTPS na rede interna (J) e backup no Google
  Drive (K, depende do rclone configurado no servidor).
