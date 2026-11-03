// Transforma os eventos gravados no histórico da tarefa em ações legíveis, uma frase por ação.
//
// Uma ação de quem usa o sistema vira vários eventos no banco: mover a tarefa grava, no MESMO
// instante e pela mesma pessoa, o fim do cronômetro ('F'), a troca de responsável ('A') e a
// mudança de etapa ('E') — ver ProjetosController.MoverEtapa. Mostrados soltos, ninguém entende
// quem fez o quê para quem. Aqui eles voltam a ser uma ação só, e o texto diz de onde para onde
// a tarefa foi e com quem ficou. Como é feito na hora de mostrar, vale para o histórico antigo.

const ATENDIMENTO = 'Atendimento';

const COR_POR_TIPO = {
  mover: 'bg-blue-100 text-blue-700',
  responsavel: 'bg-amber-100 text-amber-700',
  inicio: 'bg-green-100 text-green-700',
  pausa: 'bg-orange-100 text-orange-700',
  encerramento: 'bg-purple-100 text-purple-700',
  projetoConcluido: 'bg-teal-100 text-teal-700',
  projetoReaberto: 'bg-red-100 text-red-700',
  outro: 'bg-gray-100 text-gray-700',
};

const ROTULO_POR_TIPO = {
  mover: 'Etapa',
  responsavel: 'Responsável',
  inicio: 'Início',
  pausa: 'Pausa',
  encerramento: 'Fim',
  projetoConcluido: 'Projeto',
  projetoReaberto: 'Projeto',
  outro: 'Evento',
};

const ROTULO_EVENTO = {
  E: 'Movida para etapa',
  A: 'Responsável atribuído',
  I: 'Elaboração iniciada',
  P: 'Elaboração pausada',
  F: 'Elaboração finalizada',
  C: 'Projeto concluído',
  R: 'Projeto reaberto',
};

const instante = (evento) => new Date(evento.dataHoraAcao).getTime();

// Quem fez: nos eventos de mover e atribuir é o RealizadoPor; nos de cronômetro (I, P), o próprio
// colaborador do evento. Eventos antigos podem não ter nenhum dos dois.
const autor = (evento) => evento.realizadoPorColaboradorNome ?? evento.colaboradorNome ?? 'Alguém';

// Eventos que pertencem a uma movimentação: gravados juntos, no mesmo instante, pela mesma pessoa.
const ehDaMovimentacao = (evento) =>
  ['E', 'A', 'F'].includes(evento.tipo) || (evento.tipo === 'P' && evento.observacao === 'Troca de colaborador');

const chaveDaMovimentacao = (evento) => `${instante(evento)}|${evento.realizadoPorColaboradorId ?? evento.realizadoPorColaboradorNome ?? ''}`;

function fraseDoResponsavel(atribuicao, quemFez, comMudancaDeEtapa) {
  if (!atribuicao) return '';
  const novo = atribuicao.colaboradorNome;
  const assumiu =
    atribuicao.colaboradorId != null &&
    (atribuicao.colaboradorId === atribuicao.realizadoPorColaboradorId || novo === quemFez);
  if (comMudancaDeEtapa) {
    if (atribuicao.colaboradorId == null) return ', sem responsável';
    return assumiu ? ' e assumiu a tarefa' : ` e passou para ${novo}`;
  }
  if (atribuicao.colaboradorId == null) return ' tirou o responsável';
  return assumiu ? ' assumiu a tarefa' : ` passou a tarefa para ${novo}`;
}

function acaoDaMovimentacao(eventos, etapaAtual) {
  const mudanca = eventos.find((e) => e.tipo === 'E');
  const atribuicao = eventos.find((e) => e.tipo === 'A');
  const encerrou = eventos.some((e) => e.tipo === 'F');
  const pausouPelaTroca = eventos.some((e) => e.tipo === 'P');
  const referencia = mudanca ?? atribuicao ?? eventos[0];
  const quem = autor(referencia);

  if (mudanca) {
    const destino = mudanca.etapaNome ?? ATENDIMENTO;
    const frase =
      `${quem} moveu de ${etapaAtual} para ${destino}` +
      fraseDoResponsavel(atribuicao, quem, true) +
      (encerrou ? ' (trabalho encerrado)' : '');
    return { tipo: 'mover', frase, novaEtapa: destino };
  }
  if (atribuicao) {
    const frase = quem + fraseDoResponsavel(atribuicao, quem, false) + (pausouPelaTroca ? ' (trabalho pausado)' : '');
    return { tipo: 'responsavel', frase };
  }
  // 'F' ou pausa por troca sem mudança nem atribuição: raro, mas não some (nada é escondido).
  return { tipo: 'encerramento', frase: `${quem} encerrou o trabalho na ${etapaAtual}` };
}

function acaoAvulsa(evento, etapaAtual) {
  const etapa = evento.etapaNome ?? etapaAtual;
  if (evento.tipo === 'I') return { tipo: 'inicio', frase: `${autor(evento)} começou a trabalhar na ${etapa}` };
  if (evento.tipo === 'P') {
    const observacao = evento.observacao ? ` — "${evento.observacao}"` : '';
    return { tipo: 'pausa', frase: `${autor(evento)} pausou o trabalho na ${etapa}${observacao}` };
  }
  if (evento.tipo === 'C') return { tipo: 'projetoConcluido', frase: `${autor(evento)} concluiu o projeto` };
  if (evento.tipo === 'R') return { tipo: 'projetoReaberto', frase: `${autor(evento)} reabriu o projeto` };
  return { tipo: 'outro', frase: `${ROTULO_EVENTO[evento.tipo] ?? evento.tipo} · ${autor(evento)}` };
}

/**
 * @param {array} eventos eventos da tarefa e do projeto, em qualquer ordem
 * @returns {array} ações do mais recente para o mais antigo: { id, quando, tipo, rotulo, cor, frase }
 */
export function acoesDoHistorico(eventos) {
  const cronologicos = [...eventos]
    .map((evento, indice) => ({ evento, indice }))
    .sort((a, b) => instante(a.evento) - instante(b.evento) || a.indice - b.indice)
    .map(({ evento }) => evento);

  const acoes = [];
  let etapaAtual = ATENDIMENTO;

  for (let i = 0; i < cronologicos.length; i++) {
    const evento = cronologicos[i];
    let acao;
    let id = evento.id;

    if (ehDaMovimentacao(evento)) {
      const chave = chaveDaMovimentacao(evento);
      const grupo = [evento];
      while (i + 1 < cronologicos.length && ehDaMovimentacao(cronologicos[i + 1]) && chaveDaMovimentacao(cronologicos[i + 1]) === chave) {
        grupo.push(cronologicos[++i]);
      }
      acao = acaoDaMovimentacao(grupo, etapaAtual);
      id = grupo.map((e) => e.id).join('-');
    } else {
      acao = acaoAvulsa(evento, etapaAtual);
    }

    if (acao.novaEtapa) etapaAtual = acao.novaEtapa;
    acoes.push({
      id,
      quando: evento.dataHoraAcao,
      tipo: acao.tipo,
      rotulo: ROTULO_POR_TIPO[acao.tipo],
      cor: COR_POR_TIPO[acao.tipo],
      frase: acao.frase,
    });
  }

  return acoes.reverse();
}
