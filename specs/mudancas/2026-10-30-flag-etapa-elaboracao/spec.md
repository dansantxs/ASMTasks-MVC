# Flag "Etapa de Elaboração" e "Setor de Teste" no cadastro

- **Status:** aprovada (2026-10-30)
- **Pedido por:** Daniel, 2026-10-30
- **Branch:** `feat/flag-etapa-elaboracao`
- **Versão:**
- **Specs de domínio afetadas:** `dominio/etapas-e-fluxo.md` (glossário, ETP-06, ETP-07, ETP-09);
  `dominio/comissao.md` (glossário, COM-08, COM-10, COM-11)

## Contexto

A etapa de elaboração e o setor Suporte são reconhecidos pelo **nome** ("elabora"/"desenvolv" e
"suporte"), em sete lugares do backend e do frontend. Renomear a etapa ou o setor quebra, sem
nenhum erro aparente, a faixa Reservado, o responsável sugerido no Kanban, o seletor da etapa de
teste e o crédito da comissão. As etapas final e de teste já usam flag e não têm esse problema.

## Comportamento esperado

- No cadastro de Etapas, uma marcação **"Etapa de Elaboração"**, ao lado de "Etapa Final" e
  "Etapa de Teste".
- No cadastro de Setores, uma marcação **"Setor de Teste"**: quem pode ser responsável pela etapa
  de teste.
- Tudo o que hoje procura pelo nome passa a usar a marcação.

## Critérios de aceite

- **CA-1.** Só uma etapa pode ser de elaboração. Marcar outra desmarca a anterior, como nas
  etapas final e de teste.
- **CA-2.** Uma etapa não pode ser ao mesmo tempo de elaboração e final, nem de elaboração e de
  teste. O cadastro recusa com uma mensagem que explica o motivo.
- **CA-3.** Na atualização do banco, a etapa cujo nome contém "elabora" ou "desenvolv" já fica
  marcada, e o setor cujo nome contém "suporte" também. Depois de instalar a versão, nada muda
  para quem usa.
- **CA-4.** Dada a etapa de elaboração renomeada para "Programação", então a faixa Reservado, o
  responsável sugerido ao mover (ETP-06) e o crédito da comissão (COM-10) continuam funcionando,
  inclusive para eventos gravados antes da renomeação.
- **CA-5.** Dado o setor Suporte renomeado para "Qualidade", então o seletor da etapa de teste
  continua oferecendo os colaboradores dele.
- **CA-6.** Sem nenhuma etapa marcada como de elaboração, nada aparece como Reservado e o crédito
  da comissão cai inteiro na regra COM-11. A tela de Etapas avisa que a marcação está faltando.
- **CA-7.** Sem nenhum setor marcado como de teste, o diálogo de mover para o teste avisa, como já
  faz hoje quando o Suporte não tem ninguém.
- **CA-8.** Só um setor pode ser de teste. Marcar outro desmarca o anterior.

## Fora de escopo

- Permitir mais de uma etapa de elaboração.

## Decisões

- **2026-10-30 (Daniel):** a flag "Setor de Teste" entra junto nesta mudança.
- **2026-10-30 (Daniel):** só pode haver um setor de teste (CA-8).
