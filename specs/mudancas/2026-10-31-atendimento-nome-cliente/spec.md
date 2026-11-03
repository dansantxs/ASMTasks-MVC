# Atendimentos: nome do cliente conforme a configuração

- **Status:** aprovada (2026-10-31)
- **Pedido por:** Álvaro
- **Branch:** `fix/atendimento-nome-cliente` (depois de `feat/inicio-kanban-cliente-negrito-data`,
  porque as duas usam o mesmo helper de nome)
- **Versão:** 1.14.0
- **Specs de domínio afetadas:** `atendimentos.md` (a escrever)

## Contexto

A tela de Atendimentos monta o nome do cliente só com a razão social, ignorando a configuração
"Exibição do nome do cliente". O formulário de atendimento e o Relatório de Histórico de
Atendimentos (1.13) já seguem a configuração. O backend não precisa mudar: o cadastro de clientes
que a tela já carrega traz o nome fantasia.

## Critérios de aceite

- **CA-1.** Com a configuração em "Nome fantasia", o cliente aparece pelo nome fantasia na lista,
  nos cartões, no calendário e no detalhe do atendimento. Cliente sem nome fantasia mostra a razão
  social.
- **CA-2.** Com "Razão social", nada muda.
- **CA-3.** A busca por cliente na tela encontra o atendimento pelos dois nomes.
- **CA-4.** A regra do nome fica num helper só, compartilhado com o Kanban e o Início, para as
  telas não divergirem de novo.

## Perguntas em aberto

Nenhuma.
