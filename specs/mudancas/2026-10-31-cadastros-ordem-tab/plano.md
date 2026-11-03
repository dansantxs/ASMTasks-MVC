# Plano — Formulários: Tab na ordem da tela

Spec: [spec.md](spec.md)

## O que a leitura do código mostrou

No formulário de Clientes, a ordem dos campos no código é a mesma da tela: a grade preenche
linha por linha, sem `order-*` nem `col-start`, e não há campo desabilitado, foco movido por
código ou `tabIndex` positivo. Então a causa não é visível só lendo, e o primeiro passo é
reproduzir.

Os suspeitos, em ordem de probabilidade:

1. **Botões com `tabIndex={-1}`.** Cancelar e os botões auxiliares (criar matriz, criar
   prioridade, anexos) são pulados de propósito. Para quem usa Tab, o foco salta do último campo
   direto para Salvar, ou de um campo para o seguinte sem passar pelo botão que está entre eles.
2. **Componentes com janela suspensa** (Combobox da matriz, Select de tipo de pessoa). Se a
   janela fica aberta, o Tab pode ir para o conteúdo dela, que é montado no fim da página.
3. **O botão de fechar (X) do diálogo**, que fica no fim do código do diálogo e entra no Tab
   depois de Salvar, ou é o primeiro foco ao abrir, conforme o componente.
4. **Campos que aparecem e somem** (RG só para pessoa física): trocar o tipo de pessoa com o
   foco no campo seguinte pode fazer o foco voltar ao início.

## Passos

1. **Reproduzir no cadastro de Clientes** com o sistema rodando: abrir, apertar Tab do primeiro
   ao último campo, nas duas pessoas (física e jurídica), anotando a sequência real. Repetir com
   Shift+Tab. O resultado vai para a seção "Verificação" deste plano.
2. **Corrigir no Clientes** a causa encontrada, mexendo na ordem dos elementos ou no
   `tabIndex={-1}`, nunca com `tabIndex` positivo (CA-4). Regra para os botões (CA-3):
   - Cancelar: volta para a sequência, entre o último campo e Salvar;
   - auxiliares: entram na sequência na posição em que aparecem, porque também são ações.
3. **Foco inicial** (CA-2): o primeiro campo de cada formulário recebe o foco ao abrir, pelo
   `onOpenAutoFocus` do diálogo, para não depender de qual elemento o componente escolhe.
4. **Aplicar nos demais formulários do escopo** (os seis cadastros, Projeto e Atendimento),
   repetindo o roteiro do passo 1 em cada um.

## Arquivos afetados

| Arquivo | O que muda |
|---|---|
| `Frontend/src/app/cadastros/*/components/Formulario*.js` | Ordem, `tabIndex`, foco inicial |
| `Frontend/src/app/projetos/components/FormularioProjeto.js` | Idem |
| `Frontend/src/app/atendimentos/components/FormularioAtendimento.js` | Idem |

## Banco de dados

Sem alteração.

## Riscos e pontos de atenção

- Tirar o `tabIndex={-1}` do Cancelar muda um comportamento que alguém escolheu de propósito,
  provavelmente para que Enter no último campo não caísse no Cancelar. Enter envia o formulário
  pelo `type="submit"`, então o risco é baixo, mas confiro.
- Esta branch é a última entre as de tela, porque toca em formulários que outras branches também
  alteram.

## Como verificar

- **CA-1 a CA-3:** o roteiro do passo 1 em cada formulário, com a sequência esperada escrita aqui.
- **CA-5:** comparação visual antes e depois.
- Build do frontend.
