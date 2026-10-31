# Formulários de cadastro: Tab na ordem da tela

- **Status:** rascunho
- **Pedido por:** Álvaro
- **Branch:** `fix/cadastros-ordem-tab` (por último entre os fixes, porque mexe em formulários que
  outras branches também alteram)
- **Versão:** 1.14.0
- **Specs de domínio afetadas:** nenhuma

## Contexto

Em alguns formulários, o Tab pula de um campo para outro fora da ordem em que eles aparecem na
tela. Nenhum formulário usa `tabIndex` positivo hoje (conferido em 2026-10-31). Então o problema
está na ordem dos campos no código, que difere da ordem visual montada pelo layout em grade.

## Critérios de aceite

- **CA-1.** Em cada formulário do escopo, o Tab percorre os campos na ordem visual: de cima para
  baixo e, na mesma linha, da esquerda para a direita. Shift+Tab faz o caminho inverso.
- **CA-2.** Ao abrir o formulário, o foco vai para o primeiro campo.
- **CA-3.** Os botões do rodapé (Cancelar e Salvar) vêm depois do último campo. Botões auxiliares
  dentro do formulário (buscar CEP, criar cliente, etc.) entram na posição em que aparecem.
- **CA-4.** A correção é feita na ordem dos elementos, sem `tabIndex` positivo, que é frágil e
  fura a ordem do resto da página.
- **CA-5.** O layout visual não muda.

## Perguntas em aberto

1. **Escopo.** Os seis cadastros (Cargos, Clientes, Colaboradores, Etapas, Prioridades e Setores)
   com certeza. Entram também os formulários de **Projeto** (lançamento de tarefas) e de
   **Atendimento**, que são os mais usados no dia a dia? *Recomendação:* sim.
2. **Onde está pior?** Se você souber de algum formulário em que o problema aparece, ele vira o
   caso de teste.
