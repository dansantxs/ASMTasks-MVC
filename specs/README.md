# Specs do ASMTasks

Aqui fica **o que o sistema deve fazer**, escrito antes do código e mantido junto com ele.
O código diz *como*; a spec diz *o quê* e *por quê*.

## Estrutura

```
specs/
  dominio/      spec viva de cada área: como o sistema funciona HOJE
  mudancas/     uma pasta por mudança: o que vai MUDAR e como
  _modelos/     modelos para começar uma mudança nova
```

### `dominio/` — como o sistema funciona

Um arquivo por área de negócio. Cada regra tem um ID estável (`COM-01`, `COM-02`…) e é escrita
de forma verificável: dá para dizer, olhando um caso concreto, se o sistema cumpre ou não.

| Área | Arquivo | Prefixo | Situação |
|---|---|---|---|
| Relatório de Comissão | [comissao.md](dominio/comissao.md) | `COM` | escrita |
| Etapas e fluxo do Kanban (Reservado, teste, Suporte) | [etapas-e-fluxo.md](dominio/etapas-e-fluxo.md) | `ETP` | escrita |
| Relatórios de histórico | `relatorios-historico.md` | `HIS` | a escrever |
| Atendimentos | `atendimentos.md` | `ATD` | a escrever |
| Permissões e níveis de acesso | `permissoes.md` | `PER` | a escrever |

As specs de domínio substituem aos poucos o `Documentação/ERS.docx`. Ao escrever uma área nova,
confira o ERS e o código e registre as divergências em "Perguntas em aberto".

### `mudancas/` — o que vai mudar

Uma pasta por mudança, com nome `AAAA-MM-DD-<slug>` (a data é a do início). O slug costuma ser
o mesmo da branch: `2026-11-03-comissao-flag-desenvolvimento` ↔ `feat/comissao-flag-desenvolvimento`.

```
mudancas/2026-11-03-comissao-flag-desenvolvimento/
  spec.md      o quê e por quê: comportamento esperado e critérios de aceite
  plano.md     como: abordagem técnica, arquivos afetados, migrations, riscos
  tarefas.md   checklist de execução (opcional em mudança pequena)
```

## O fluxo

1. **Spec.** Copie `_modelos/spec.md` e preencha. Os critérios de aceite são o mais importante:
   é por eles que se decide se a mudança ficou pronta. Status: `rascunho`.
2. **Aprovação da spec.** Quem pediu (ou o Daniel) revisa. Perguntas em aberto se resolvem aqui,
   não durante o código. Status: `aprovada`.
3. **Plano.** `plano.md` com a abordagem e os arquivos afetados. Aprovado o plano, começa o código.
4. **Implementação.** Em branch própria, a partir da `main`. Comentários que implementam uma
   regra citam o ID dela.
5. **Fechamento.** No mesmo branch: as regras novas ou alteradas entram na spec de domínio
   (com ID novo, ou o mesmo ID atualizado), e a spec da mudança fica com status `implementada` e
   a versão em que saiu. A pasta da mudança continua no repositório como registro da decisão.

**Precisa de spec?** Mudança de comportamento ou de regra de negócio, sim. Correção que só faz o
sistema voltar a cumprir uma regra que já está escrita, basta citar o ID no commit. Ajuste
visual ou de texto não precisa.

## Como escrever uma regra

- Uma regra por item, no presente: "A tarefa entra no relatório quando…".
- Diga o que acontece nos casos de borda (vazio, sem responsável, sem cadastro), não só no caso feliz.
- Quando a regra tiver um porquê que não é óbvio, escreva o porquê. É ele que impede alguém de
  "simplificar" a regra depois.
- Não descreva a implementação (nomes de variáveis, hooks). Cite o arquivo só em "Onde está no código".
- Um exemplo concreto vale mais que um parágrafo. Prefira o formato *Dado / Quando / Então*.
