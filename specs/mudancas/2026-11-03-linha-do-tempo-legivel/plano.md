# Plano — Linha do tempo da tarefa em frases

Spec: [spec.md](spec.md)

## Abordagem

Só frontend. Os eventos continuam vindo do mesmo endpoint e do mesmo jeito; uma função pura
transforma a lista de eventos em uma lista de **ações**, e o diálogo passa a mostrar as ações.
Como a transformação é feita na hora de mostrar, vale também para o histórico antigo (CA-8).

## A função (`projetos/kanban/utils/acoesDoHistorico.js`)

Entrada: os eventos da tarefa (e os do projeto, que hoje já são misturados na lista), em ordem
cronológica. Saída: ações, cada uma com `quando`, `quem`, `tipo` (mover, responsavel,
cronometro, projeto) e `frase`.

1. **Agrupar** eventos com o mesmo `DataHoraAcao` e o mesmo `RealizadoPor` numa ação (CA-1). É
   assim que o `MoverEtapa` grava: `F`, `P`, `A` e `E` saem no mesmo instante.
2. **Etapa de origem** (CA-2): a função percorre os eventos em ordem e guarda a etapa atual; o
   `E` diz o destino, e a origem é a etapa guardada (Atendimento no começo).
3. **Responsável** (CA-3, CA-4): o `A` da ação diz quem ficou. Igual a quem fez: "assumiu a
   tarefa"; nulo: "sem responsável" ou "tirou o responsável"; outro: "passou para <nome>".
4. **Cronômetro** (CA-5): `I` e `P` sem mudança de etapa viram "começou a trabalhar na <etapa>" e
   "pausou o trabalho na <etapa>", com a observação da pausa. O `F` e o `P` "Troca de
   colaborador" dentro de uma mudança viram o sufixo "(trabalho encerrado)".
5. **Projeto:** `C` e `R` viram "<quem> concluiu o projeto" e "<quem> reabriu o projeto".
6. Devolve do mais recente para o mais antigo (CA-9).

"Quem fez" é o `RealizadoPorColaboradorNome`. Nos eventos antigos em que ele está vazio, usa o
`ColaboradorNome` do próprio evento, e a frase fica sem o sujeito se nenhum dos dois existir.

## O diálogo (`DialogoVisualizarTarefa.js`)

- A lista passa a percorrer as ações. Cada linha: etiqueta colorida do tipo (CA-6), a frase e a
  data.
- A paginação "Ver mais" passa a contar ações, e o número entre parênteses no título também.

## Arquivos afetados

| Arquivo | O que muda |
|---|---|
| `Frontend/src/app/projetos/kanban/utils/acoesDoHistorico.js` | Novo: eventos → ações |
| `Frontend/src/app/projetos/kanban/components/DialogoVisualizarTarefa.js` | Mostra as ações |
| `specs/dominio/etapas-e-fluxo.md` | Como as ações são lidas a partir dos eventos |

## Banco de dados

Sem alteração.

## Riscos e pontos de atenção

- Eventos gravados no mesmo segundo por ações diferentes da mesma pessoa (raro) seriam juntados
  numa frase só. O `MoverEtapa` grava tudo com o mesmo `DateTime.Now`, então o agrupamento por
  instante exato é seguro para o caso comum.
- **CA-7** (nada é escondido): a função não descarta evento. Evento que não se encaixa em
  nenhuma regra vira uma frase genérica com o rótulo de hoje.

## Como verificar

- A tarefa do print (Granja JF Ovonovo, "Relatório de saldo dos produtos") deve sair exatamente
  como o exemplo da spec.
- Um roteiro com o histórico de três tarefas reais da base de desenvolvimento: uma com troca de
  responsável sem mover, uma com pausa com observação e uma concluída num projeto que fechou.
- Build do frontend.
