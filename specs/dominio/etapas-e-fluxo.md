# Etapas e fluxo do Kanban

- **Prefixo das regras:** `ETP`
- **Telas:** Projetos › Kanban; Cadastros › Etapas
- **Última revisão:** 2026-10-30, versão 1.13.0

## Propósito

Como uma tarefa anda pelo fluxo: as colunas, quem pode movê-la, quem fica responsável em cada
etapa e o que fica gravado no histórico. O histórico gravado aqui é a matéria-prima dos
relatórios de histórico e de comissão.

## Glossário

| Termo | Significado |
|---|---|
| **Atendimento** | Primeira coluna do Kanban. **Não** é uma etapa cadastrada: é a tarefa sem etapa. |
| **Etapa final** | A etapa marcada com "Etapa Final". Chegar nela conclui a tarefa. |
| **Etapa de teste** | A etapa marcada com "Etapa de Teste". |
| **Etapa de elaboração** | A etapa cujo **nome** contém "elabora" ou "desenvolv". Não há flag no cadastro (ver [mudança proposta](../mudancas/2026-10-30-flag-etapa-elaboracao/spec.md)). |
| **Setor Suporte** | O setor cujo **nome** contém "suporte". |
| **Reservado** | Faixa dentro da etapa de elaboração (ETP-09). Não é etapa nem coluna. |

### Eventos do histórico da tarefa

| Tipo | Quando é gravado | Colaborador gravado |
|---|---|---|
| `E` | Mudança de etapa | O responsável **de antes** da mudança, ou seja, quem fez a etapa que está sendo deixada |
| `A` | Troca de responsável | O novo responsável |
| `I` | Início (cronômetro aberto) | — |
| `P` | Pausa | O responsável que pausou |
| `F` | Fim da elaboração por mudança de etapa com cronômetro aberto | — |

## Regras

### Cadastro de etapas

- **ETP-01. Ordem.** As etapas têm uma ordem, que define as colunas do Kanban depois de
  Atendimento. O nome é único.
- **ETP-02. Uma final e uma de teste.** Só pode haver uma etapa final e uma de teste. Marcar
  outra etapa desmarca a anterior.

### Mover a tarefa

- **ETP-03. Quem pode mover.** Se a tarefa tem responsável, só ele ou um administrador pode
  movê-la. Tarefa sem responsável pode ser movida por qualquer pessoa.
- **ETP-04. Voltar para Atendimento** remove o responsável.
- **ETP-05. O que é gravado ao mover.** Nesta ordem:
  1. se o cronômetro estava aberto e a etapa mudou, um `F` encerra a elaboração;
  2. se o responsável mudou, um `A` com o novo responsável (e, se o cronômetro estava aberto e
     a etapa **não** mudou, antes dele um `P` com a observação "Troca de colaborador");
  3. se a etapa mudou, um `E` com o responsável de antes.
- **ETP-06. Responsável sugerido ao mover.** O diálogo de mover já abre com:
  - **teste:** quem fez o teste da última vez, se ainda for do setor Suporte; senão, ninguém;
  - **elaboração:** quem desenvolveu na última passagem por ela; se essa pessoa for de outro
    setor, a lista abre mostrando todos os setores para ela aparecer selecionada;
  - **Atendimento:** ninguém (ETP-04);
  - **demais etapas:** o responsável atual.
- **ETP-07. Teste só com o Suporte.** Na etapa de teste, o seletor de responsável oferece apenas
  os colaboradores do setor Suporte. Sem ninguém ativo no setor, o diálogo avisa.
- **ETP-08. Responsáveis por setor.** Nas outras etapas, o seletor mostra os colaboradores do
  setor da tarefa, com a opção de mostrar todos os setores.

### Situação da tarefa

- **ETP-09. Reservado.** A tarefa está "Reservada" quando está na etapa de elaboração e **nunca**
  foi iniciada (não há nenhum `I` no histórico dela). Se voltar do teste para a elaboração, ela
  não volta a ser reservada, porque já foi elaborada. *Por quê:* separa o que alguém vai fazer
  do que já está sendo feito, como o status "Reservado" do sistema antigo.
- **ETP-10. Status.** "Em andamento" com o cronômetro aberto; "Pausada" se houve pausa depois da
  última mudança de etapa; senão, "Ociosa".
- **ETP-11. Iniciar.** Só é possível iniciar uma tarefa que está numa etapa (não em Atendimento),
  tem responsável e não está em andamento. Só o responsável ou um administrador pode iniciar. O
  início é permitido em qualquer etapa, e o evento `I` grava a etapa em que aconteceu.
- **ETP-14. Uma tarefa em andamento por pessoa.** O responsável não pode iniciar uma tarefa se
  já tiver outra em andamento: o sistema pede que ele pause a outra antes.
- **ETP-12. Pausar.** Só é possível pausar uma tarefa em andamento, e só o responsável ou um
  administrador pode fazê-lo.

### Projeto

- **ETP-13. Conclusão automática.** O projeto fica concluído quando todas as tarefas dele estão
  na etapa final, e volta a ficar em aberto se alguma sair dela. A conclusão é registrada no
  histórico do projeto.

## Dependências do cadastro

| Depende de | Como é reconhecido | Se mudar |
|---|---|---|
| Etapa final | flag | Seguro contra renomeação. |
| Etapa de teste | flag | Seguro contra renomeação. |
| Etapa de elaboração | nome contém "elabora" ou "desenvolv" | A faixa Reservado some, a sugestão de ETP-06 deixa de funcionar e o crédito da comissão muda. Nenhum erro aparece. |
| Setor Suporte | nome contém "suporte" | O seletor da etapa de teste fica vazio. |

## Problemas conhecidos

- **Início fora da elaboração esconde o Reservado.** Hoje, um início em qualquer etapa conta para
  ETP-09, e uma tarefa iniciada na análise nunca aparece como Reservada. Daniel confirmou em
  2026-10-30 que isso não é o desejado. Correção em
  [reservado-so-inicio-na-elaboracao](../mudancas/2026-10-30-reservado-so-inicio-na-elaboracao/spec.md).

## Perguntas em aberto

Nenhuma.

## Onde está no código

- Mover, iniciar e pausar: `ProjetosController` (`MoverEtapa`, `IniciarTarefa`, `PausarTarefa`)
- Status e Reservado: `Backend/API/DB/DAOs/TarefaSql.cs`, `Frontend/src/utils/situacaoTarefa.js`
- Diálogo de mover e seletor de responsável: `Frontend/src/app/projetos/kanban/components/DialogoMoverTarefa.js`,
  `Frontend/src/app/projetos/kanban/utils/opcoesResponsavel.js`
- Cadastro de etapas: `Backend/API/Models/Etapa.cs`, `EtapasController`
- Conclusão do projeto: `ProjetosDAO.AtualizarStatusConclusaoProjetoAsync`
