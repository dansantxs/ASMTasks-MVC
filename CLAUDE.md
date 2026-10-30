# ASMTasks

Sistema de gestão de projetos, tarefas (Kanban por etapas) e atendimentos, com relatórios de
histórico e de comissão.

- **Backend:** ASP.NET (.NET 9), ADO.NET puro com DAOs — `Backend/API` (Controllers → DAOs em
  `DB/DAOs`, DTOs, Models). Scripts SQL em `Backend/Database` (`schema.sql` + `migration_*.sql`).
- **Frontend:** Next.js (App Router) + React Query — `Frontend/src/app/<tela>/` com `api/` por tela.
- **Build (é o que o CI roda):** `dotnet build Backend/ASMTasks-Backend.sln` e, em `Frontend/`,
  `npm run build`. Ainda não há testes automatizados.
- Comandos de ambiente (setup, containers, deploy, backup): [GUIA-POWERSHELL.md](GUIA-POWERSHELL.md).

## Fluxo: Spec-Driven Development

O projeto segue o fluxo descrito em [specs/README.md](specs/README.md). Resumo do que é obrigatório:

1. **Antes de mexer em regra de negócio**, leia a spec de domínio da área em `specs/dominio/`.
   Ela é a fonte da verdade do comportamento; se o código divergir dela, aponte a divergência
   em vez de "corrigir" em silêncio para um dos lados.
2. **Mudança nova** (feature ou fix que altera comportamento) começa em
   `specs/mudancas/AAAA-MM-DD-<slug>/spec.md`, a partir de `specs/_modelos/`. Só depois de a
   spec ser aprovada vem o `plano.md`, e só depois do plano aprovado vem o código.
   Ajuste puramente visual ou de texto não precisa de spec.
3. **Ao concluir**, incorpore as regras novas ou alteradas na spec de domínio correspondente
   (no mesmo branch) e marque a spec da mudança como `implementada`.
4. Regras têm ID (`COM-03`, por exemplo). Cite o ID em comentários de código e, quando houver
   testes, no nome do teste.

## Convenções de trabalho

- Uma branch por tarefa, sempre criada a partir da `main` (nunca de uma branch de versão).
- A mudança de versão (`Frontend/src/versao.js`: `VERSAO_ATUAL` + `CHANGELOG`) vai numa branch
  própria, por último. Siga a regra de versionamento escrita no topo do arquivo.
- Não fazer merge nem push sem pedido explícito.
- Texto de interface, comentários, specs e mensagens de commit em português.

## Pontos frágeis conhecidos

Algumas regras reconhecem etapas e setores pelo **nome**, não por flag do cadastro. Renomear
o cadastro quebra essas regras sem nenhum erro aparente. Detalhes em `specs/dominio/comissao.md`
(seção "Dependências do cadastro").
