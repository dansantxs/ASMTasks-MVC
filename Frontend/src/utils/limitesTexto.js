// Tamanho máximo dos campos de texto, igual ao que a coluna do banco aceita.
//
// Existe para o campo travar na digitação em vez de o usuário escrever tudo, mandar salvar e só
// então descobrir que passou do limite. O backend valida de novo — quem chama a API por fora do
// formulário também precisa do aviso —, então estes números têm de bater com os de
// Backend/API/Models/LimitesDeTexto.cs e com o schema do banco.
//
// Campo sem limite aqui é campo de texto ilimitado no banco (nvarchar(max)), como a descrição da
// tarefa e a do projeto.

export const LIMITES = {
  atendimento: {
    titulo: 120,
    descricao: 500,
    observacaoConclusao: 2000,
  },
  tarefa: {
    titulo: 200,
  },
  projeto: {
    titulo: 200,
  },
};

/** "412 / 500" para mostrar ao lado do campo; vazio enquanto sobra bastante espaço. */
export const contagem = (valor, maximo) => {
  const usado = (valor ?? '').length;
  return { usado, maximo, perto: usado >= maximo * 0.8, estourou: usado > maximo };
};
