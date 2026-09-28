// Opções do seletor de responsável no Kanban (mover tarefa e trocar responsável).

const SEM_RESPONSAVEL = { value: '', label: 'Sem responsável' };

const rotulo = (col) => `${col.nome}${col.cargoNome ? ` — ${col.cargoNome}` : ''}`;
const opcao = (col, prefixo = '') => ({ value: String(col.id), label: `${prefixo}${rotulo(col)}` });

// A etapa de teste só aceita o setor Suporte, reconhecido pelo NOME do setor — o cadastro de
// Setor não tem uma marcação para isso. Se o setor for renomeado, ajuste aqui.
export const ehSetorSuporte = (setorNome) => /suporte/i.test(setorNome ?? '');

export const colaboradoresDoSuporte = (colaboradores) =>
  colaboradores.filter((col) => ehSetorSuporte(col.setorNome));

export function montarOpcoesSuporte(colaboradores) {
  return [SEM_RESPONSAVEL, ...colaboradoresDoSuporte(colaboradores).map((col) => opcao(col))];
}

export function montarOpcoesColaboradores(colaboradores, setorId, mostrarTodosSetores) {
  if (!setorId) {
    return [SEM_RESPONSAVEL, ...colaboradores.map((col) => opcao(col))];
  }

  const doSetor = colaboradores.filter((c) => c.setorId === setorId);
  if (!mostrarTodosSetores) {
    return [SEM_RESPONSAVEL, ...doSetor.map((col) => opcao(col))];
  }

  const outros = colaboradores.filter((c) => c.setorId !== setorId);
  return [
    SEM_RESPONSAVEL,
    ...doSetor.map((col) => opcao(col, 'Setor da tarefa · ')),
    ...outros.map((col) => opcao(col, 'Outros setores · ')),
  ];
}
