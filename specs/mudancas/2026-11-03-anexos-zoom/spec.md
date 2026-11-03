# Anexos: ver a imagem com zoom sem abrir outra guia

- **Status:** rascunho
- **Pedido por:** Daniel, 2026-11-03
- **Branch:** `feat/anexos-zoom`
- **Versão:**
- **Specs de domínio afetadas:** nenhuma

## Contexto

Hoje, clicar na miniatura de um anexo de imagem abre a imagem numa guia nova do navegador. Para
ver um detalhe (um número num romaneio fotografado, por exemplo), é preciso ir para essa guia,
dar zoom e voltar. Os PDFs também abrem numa guia nova.

## Comportamento esperado

Clicar numa imagem abre um visualizador **por cima da tela atual**, com zoom, sem sair da tarefa.

## Critérios de aceite

- **CA-1.** Clicar na miniatura de uma imagem abre o visualizador sobre a tela, com o fundo
  escurecido. Esc, o X ou um clique fora da imagem fecham e voltam para onde a pessoa estava.
- **CA-2.** Zoom pela roda do mouse (no ponto em que o mouse está), pelos botões **+** e **−** e
  por um botão **Ajustar à tela**. Duplo clique alterna entre ajustado e 100%.
- **CA-3.** Com zoom, a imagem é arrastada com o mouse para ver as partes que ficaram de fora.
- **CA-4.** Com mais de uma imagem na tarefa, setas na tela e as setas do teclado passam para a
  anterior e a próxima, mostrando "2 de 5" e o nome do arquivo.
- **CA-5.** Um botão **Baixar** salva o arquivo original, como hoje.
- **CA-6.** Funciona em todo lugar onde a miniatura aparece: no detalhe da tarefa no Kanban e no
  formulário do projeto.
- **CA-7.** Funciona no Chrome 109 (Windows 7), que o sistema ainda atende.

## Fora de escopo

- Girar ou editar a imagem.

## Perguntas em aberto

1. **PDFs.** Continuam abrindo numa guia nova, ou também passam a abrir por cima da tela (com o
   leitor de PDF do próprio navegador, dentro do visualizador)? *Recomendação:* também por cima da
   tela, para o comportamento ser o mesmo para qualquer anexo.
2. **Celular.** No celular, zoom com dois dedos (pinça) entra? *Recomendação:* sim, se o sistema for
   usado no celular; senão, fica de fora.
