# Plano — Kanban: mover várias tarefas de uma vez

Spec: [spec.md](spec.md)

## Abordagem

**Sem backend novo.** O frontend chama o endpoint que já existe
(`PUT /projetos/tarefas/{id}/etapa`) uma vez por tarefa, **em sequência**. Assim cada tarefa passa
pelas mesmas regras de quando é movida sozinha (CA-11): permissão (ETP-03), histórico (ETP-05),
encerramento do cronômetro (CA-13) e conclusão automática do projeto (ETP-13), sem duplicar nada
em SQL. Em sequência, e não em paralelo, porque duas tarefas do mesmo projeto recalculam a
conclusão dele, e porque assim o aviso de CA-12 sai na ordem da seleção.

Um endpoint em lote seria mais rápido, mas exigiria repetir no servidor as regras de
`MoverEtapa` ou extraí-las. Para os volumes do dia a dia (até dezenas de tarefas), a sequência
basta. Se ficar lento, o lote vira uma mudança à parte.

## Partes

### 1. Seleção (`kanban/page.js` e `QuadroKanban`)

- Estado `selecionadas: Set<tarefaId>` no `QuadroKanban`. Limpa com Esc (CA-3), ao mudar os
  filtros (efeito sobre a lista `tarefas`) e depois de mover.
- **Ctrl/Cmd+clique** no cartão alterna a seleção (CA-1) em vez de abrir a tarefa. O clique
  simples continua abrindo (CA-2).
- **Caixinha** no canto do cartão: aparece ao passar o mouse e fica visível quando marcada.
- Cartão marcado ganha borda e fundo de destaque. Uma barra fixa no topo do quadro mostra
  "N tarefas selecionadas · Limpar seleção".
- Tarefa que a pessoa não pode mover (ETP-03 e ETP-15) pode ser marcada, mas a caixinha mostra
  um cadeado e ela é avisada no diálogo (CA-12).

### 2. Arrasto (`QuadroKanban.handleDragEnd`)

- Arrastou uma tarefa **marcada**: o pacote é a seleção inteira; arrastou uma **não marcada**:
  só ela, e a seleção fica como estava (CA-5, CA-6).
- No `DragOverlay`, o cartão arrastado ganha o selo "+N" quando o pacote tem mais de uma tarefa.
- Do pacote, saem as tarefas que já estão na coluna de destino (CA-7). Sobrando uma, segue o
  fluxo de hoje, sem nenhuma mudança.
- Destino Atendimento continua só para administrador (ETP-15), com a confirmação de ETP-04.

### 3. Diálogo (`DialogoMoverTarefa`)

- A sugestão de responsável de ETP-06, que hoje está dentro do `useEffect` do diálogo, vira uma
  função pura em `kanban/utils/responsavelSugerido.js`, usada para uma tarefa ou para várias.
- Várias tarefas: o diálogo lista os títulos (rolagem a partir de 8) e calcula a sugestão de
  cada uma. Todas iguais: o campo vem com esse nome (CA-9). Diferentes: o campo vem com a opção
  **"Manter o sugerido de cada tarefa"**, que é o valor padrão; escolher um nome aplica a todas.
- As opções de responsável (setor de teste, setor da tarefa) seguem ETP-07 e ETP-08. Com
  tarefas de setores diferentes, a lista mostra todos os setores.
- Tarefas que a pessoa não pode mover aparecem riscadas, com o motivo, e não são enviadas.

### 4. Envio e resultado (`kanban/page.js`)

- Nova função `moverVarias(tarefas, etapaId, responsavelPorTarefa)`: chama
  `moverTarefaEtapa` para cada uma, em sequência, e junta os erros sem parar no primeiro (CA-12).
- Ao fim: invalida as consultas do quadro uma vez só e mostra um aviso: "5 tarefas movidas para
  Aprovação" ou "4 de 5 movidas. Não foi possível mover: <título> (<mensagem do servidor>)".
- Enquanto envia, o quadro fica bloqueado para arrasto, com "Movendo 3 de 5…".

## Arquivos afetados

| Arquivo | O que muda |
|---|---|
| `Frontend/src/app/projetos/kanban/components/QuadroKanban.js` | Seleção, pacote do arrasto, selo "+N" |
| `Frontend/src/app/projetos/kanban/components/CartaoTarefa.js` | Ctrl+clique, caixinha, destaque |
| `Frontend/src/app/projetos/kanban/components/ColunaKanban.js` | Repassa seleção e alternância |
| `Frontend/src/app/projetos/kanban/components/DialogoMoverTarefa.js` | Modo várias tarefas |
| `Frontend/src/app/projetos/kanban/utils/responsavelSugerido.js` | Novo: regra de ETP-06 como função |
| `Frontend/src/app/projetos/kanban/page.js` | `moverVarias`, aviso de resultado, barra de seleção |
| `specs/dominio/etapas-e-fluxo.md` | Regra nova de mover em lote |

## Banco de dados

Sem alteração.

## Riscos e pontos de atenção

- **dnd-kit** arrasta um item por vez. O pacote é só visual (selo) e lógico (lista enviada); não
  há arrasto real de vários cartões. É o padrão de quadros como Trello e Jira.
- O `ColunaKanban` é `memo`: a seleção tem de chegar sem recriar as listas de tarefas a cada
  clique, senão o arrasto fica lento em quadros grandes.
- Mover em sequência gera N invalidações se feito pela mutação de hoje; por isso `moverVarias`
  invalida uma vez só no fim.

## Como verificar

- **CA-1 a CA-4:** seleção por Ctrl+clique e caixinha, Esc, troca de filtro, colunas diferentes.
- **CA-5 a CA-7:** arrastar marcada, não marcada, e pacote com tarefa já no destino.
- **CA-8 a CA-10:** sugestão igual, sugestões diferentes ("Manter o sugerido"), destino teste e
  Atendimento.
- **CA-11 a CA-13:** na base de desenvolvimento, mover 3 tarefas e conferir o histórico de cada
  uma igual ao de um movimento simples; misturar uma tarefa de outra pessoa (sem ser
  administrador) e uma em andamento.
- Builds do frontend.
