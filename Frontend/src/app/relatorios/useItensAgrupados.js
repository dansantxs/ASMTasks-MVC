'use client';

import { useMemo } from 'react';
import { ROTULO_RESERVADO, ehEtapaElaboracao } from '../../utils/situacaoTarefa';

/**
 * Monta os itens agrupados que o Relatório de Comissão e os de Histórico mostram: um bloco por
 * tarefa/atendimento, com as passagens por etapa dentro dele.
 *
 * Isto NÃO é uma lista de eventos. O histórico guarda eventos soltos; aqui eles viram a história
 * da tarefa — e por isso aparecem linhas que não existem no banco: o lançamento ("Atendimento"),
 * o "Reservado" e a elaboração deduzida de quem não passou por ela.
 *
 * Ficava dentro do Relatório de Comissão. Saiu para cá quando os relatórios de histórico passaram
 * a mostrar a mesma coisa: duas cópias desta lógica divergiriam, e foi assim que nasceram bugs
 * como o "Reservado" saindo no nome errado num relatório e certo no outro.
 */

// A etapa "de desenvolvimento" de uma tarefa é identificada pelo NOME da etapa cadastrada. Ela
// define o "Desenvolvedor" — sob quem o item é agrupado e quem conta no Resumo por elaboração.
// Para atendimento, o equivalente ao desenvolvedor é quem concluiu.
// Reconhecer pelo nome é frágil a renomeações: se as etapas mudarem de nome, ajuste o padrão
// abaixo. Já a etapa de teste (o "Aprovador" do item e o Resumo por teste) vem da flag
// "Etapa de Teste" do cadastro, que não depende do nome.
export const ehEtapaDesenvolvimento = (nome) => /desenvolv|elabora/i.test(nome ?? '');

export const SEM_DESENVOLVEDOR = 'Sem desenvolvedor';
// Primeira linha de todo item: quem lançou a tarefa/atendimento. Não é uma etapa cadastrada —
// é uma linha sintética montada a partir de quem cadastrou. Aparece como "Atendimento" porque é
// isso que ela representa no vocabulário da equipe: quem recebeu a demanda do cliente e a lançou.
export const ETAPA_LANCAMENTO = 'Atendimento';
export const ETAPA_ATENDIMENTO_CONCLUIDO = 'Atendimento Concluído';

export const formatDateTime = (value) =>
  value
    ? new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(value))
    : ' ';

// Tempo de execução e de teste, como no relatório do sistema antigo. O PREVISTO é o que está
// cadastrado na tarefa (valor + unidade D/H/M); o REALIZADO vem do backend em minutos, somado de
// todo o histórico da tarefa — inclusive o que aconteceu antes do período consultado.
const MINUTOS_POR_UNIDADE = { D: 1440, H: 60, M: 1 };

export const previstoEmMinutos = (valor, unidade) =>
  valor ? valor * (MINUTOS_POR_UNIDADE[unidade] ?? 60) : 0;

export function formatarMinutos(minutos) {
  if (!minutos) return null;
  if (minutos < 60) return `${minutos}min`;
  const horas = Math.floor(minutos / 60);
  const restoMin = minutos % 60;
  if (horas < 24) return restoMin ? `${horas}h ${restoMin}min` : `${horas}h`;
  const dias = Math.floor(horas / 24);
  const restoHoras = horas % 24;
  return restoHoras ? `${dias}d ${restoHoras}h` : `${dias}d`;
}

/** "2h 15min (prev. 3h)" \x{2014} omite a parte que nao existe. */
export function formatarTempoComPrevisto(minutosRealizados, minutosPrevistos) {
  const realizado = formatarMinutos(minutosRealizados);
  const previsto = formatarMinutos(minutosPrevistos);
  if (!realizado && !previsto) return null;
  if (!previsto) return realizado;
  if (!realizado) return `prev. ${previsto}`;
  return `${realizado} (prev. ${previsto})`;
}

/**
 * @param {object}  opcoes
 * @param {array}   opcoes.registrosTarefa      eventos do histórico de tarefas (relatorio-historico)
 * @param {array}   opcoes.eventosAtendimento   eventos do histórico de atendimentos
 * @param {array}   opcoes.atendimentos         lista completa de atendimentos (para quem concluiu/lançou)
 * @param {array}   opcoes.colaboradores        cadastro, para resolver nomes
 * @param {array}   opcoes.clientes             cadastro, para resolver o nome conforme a configuração
 * @param {array}   opcoes.etapas               cadastro, para as flags e a ordem do fluxo
 * @param {string}  opcoes.exibicaoNomeCliente  'razaoSocial' | 'nomeFantasia'
 * @param {boolean} opcoes.somenteConcluidas    true na Comissão: só tarefas que chegaram na etapa
 *                                              final. Os históricos mostram tudo.
 * @param {string}  opcoes.tipoItem             'todos' | 'tarefa' | 'atendimento' | 'teste'
 */
export function useItensAgrupados({
  registrosTarefa = [],
  eventosAtendimento = [],
  atendimentos = [],
  colaboradores = [],
  clientes = [],
  etapas = [],
  exibicaoNomeCliente = 'razaoSocial',
  somenteConcluidas = false,
  tipoItem = 'todos',
}) {
  // Etapa marcada como final (Configurações > Etapas).
  const etapaFinalId = useMemo(() => etapas.find((e) => e.ehEtapaFinal)?.id ?? null, [etapas]);

  // Etapas marcadas como Etapa de Teste — de onde sai o "Aprovador" de cada tarefa.
  const etapaTesteIds = useMemo(
    () => new Set(etapas.filter((e) => e.ehEtapaTeste).map((e) => e.id)),
    [etapas]
  );

  // Nome da etapa de elaboração como está no cadastro, para a linha deduzida usar o mesmo
  // vocabulário das demais. Sem etapa cadastrada, fica o termo genérico.
  const nomeEtapaElaboracao = useMemo(
    () => etapas.find((e) => ehEtapaDesenvolvimento(e.nome))?.nome ?? 'Elaboração',
    [etapas]
  );

  // Ordem das etapas como estão cadastradas no fluxo. As linhas de cada item são exibidas
  // nessa ordem, e não na cronológica: como fica só a última passagem por etapa, uma tarefa que
  // voltou da aprovação para a elaboração mostraria a elaboração depois da aprovação.
  const ordemPorEtapaId = useMemo(
    () => new Map(etapas.map((e) => [e.id, e.ordem ?? 0])),
    [etapas]
  );
  const ordemEtapaElaboracao = useMemo(
    () => etapas.find((e) => ehEtapaDesenvolvimento(e.nome))?.ordem ?? 0,
    [etapas]
  );

  // Lugar de cada linha no fluxo. As linhas sintéticas não têm etapa cadastrada: o lançamento
  // abre o item, o Reservado encosta na elaboração que antecede, e a elaboração deduzida ocupa
  // o lugar da própria elaboração. Etapa que saiu do cadastro vai para o fim.
  const ordemDaLinha = (item) => {
    if (item.etapaId != null) return ordemPorEtapaId.get(item.etapaId) ?? Number.MAX_SAFE_INTEGER;
    if (item.etapaNome === ETAPA_LANCAMENTO) return Number.MIN_SAFE_INTEGER;
    if (item.etapaNome === ROTULO_RESERVADO) return ordemEtapaElaboracao - 0.5;
    if (item.etapaNome === nomeEtapaElaboracao) return ordemEtapaElaboracao;
    return Number.MAX_SAFE_INTEGER;
  };

  // Cliente vindo do cadastro (id, nome, nomeFantasia)
  function resolverNomeClienteCadastro(cliente) {
    if (exibicaoNomeCliente === 'nomeFantasia' && cliente.nomeFantasia) return cliente.nomeFantasia;
    return cliente.nome ?? '';
  }

  // Cliente vindo do histórico (clienteNome, clienteNomeFantasia)
  function resolverNomeCliente(item) {
    if (exibicaoNomeCliente === 'nomeFantasia' && item.clienteNomeFantasia) return item.clienteNomeFantasia;
    return item.clienteNome ?? 'Sem cliente';
  }

  const colaboradorNomePorId = useMemo(
    () => new Map(colaboradores.map((c) => [c.id, c.nome])),
    [colaboradores]
  );
  const clientePorId = useMemo(() => new Map(clientes.map((c) => [c.id, c])), [clientes]);
  const atendimentoPorId = useMemo(() => new Map(atendimentos.map((a) => [a.id, a])), [atendimentos]);

  // Contexto por tarefa que não varia entre os eventos do histórico (quem lançou, quando, e a
  // descrição da tarefa) — vem replicado em todo registro, então basta o primeiro visto.
  const infoPorTarefa = useMemo(() => {
    const mapa = new Map();
    registrosTarefa.forEach((r) => {
      if (mapa.has(r.tarefaId)) return;
      mapa.set(r.tarefaId, {
        lancadoPorColaboradorId: r.cadastradoPorColaboradorId ?? null,
        lancadoPorNome: r.cadastradoPorNome ?? null,
        lancadoPorData: r.tarefaDataCadastro ? new Date(r.tarefaDataCadastro) : null,
        descricao: r.tarefaDescricao ?? null,
        execucaoPrevistaMin: previstoEmMinutos(r.tempoExecucaoValor, r.tempoExecucaoUnidade),
        testePrevistoMin: previstoEmMinutos(r.tempoTesteValor, r.tempoTesteUnidade),
        execucaoRealizadaMin: r.minutosElaboracao ?? 0,
        testeRealizadoMin: r.minutosTeste ?? 0,
      });
    });
    return mapa;
  }, [registrosTarefa]);

  // Uma linha "Atendimento Concluído" por atendimento concluído no período (Status ainda 'R' — se
  // foi reaberto depois, não conta). Diferente de tarefa, não tem etapas; o crédito da comissão é
  // de quem concluiu (concluidoPor*). Os demais colaboradores atribuídos ficam só em
  // `participantesIds`, usado como reserva quando não se sabe quem concluiu.
  const linhasAtendimento = useMemo(() => {
    const resultado = [];
    const atendimentosVistos = new Set();

    eventosAtendimento
      .filter((evento) => evento.tipo === 'C' && evento.atendimentoStatusAtual === 'R')
      .forEach((evento) => {
        if (atendimentosVistos.has(evento.atendimentoId)) return; // só a 1ª conclusão no período
        atendimentosVistos.add(evento.atendimentoId);

        const atendimento = atendimentoPorId.get(evento.atendimentoId);
        const participantesIds = atendimento?.colaboradoresIds?.length
          ? atendimento.colaboradoresIds
          : evento.colaboradorId
            ? [evento.colaboradorId]
            : [];
        const dataConclusao = atendimento?.dataHoraConclusao
          ? new Date(atendimento.dataHoraConclusao)
          : evento.dataHoraAcao
            ? new Date(evento.dataHoraAcao)
            : null;
        const cliente = clientePorId.get(evento.clienteId);
        const clienteNome = cliente ? resolverNomeClienteCadastro(cliente) : evento.clienteNome ?? 'Sem cliente';

        const concluidoPorId = atendimento?.concluidoPorColaboradorId ?? evento.colaboradorId ?? null;
        const concluidoPorNome =
          colaboradorNomePorId.get(concluidoPorId) ?? evento.colaboradorNome ?? 'Sem responsável';

        resultado.push({
          id: `atendimento-${evento.atendimentoId}`,
          itemTipo: 'atendimento',
          tarefaId: `atendimento-${evento.atendimentoId}`,
          colaboradorId: concluidoPorId,
          colaboradorNome: concluidoPorNome,
          etapaId: null,
          etapaNome: ETAPA_ATENDIMENTO_CONCLUIDO,
          rawDataHoraAcao: dataConclusao,
          dataHoraAcao: formatDateTime(dataConclusao),
          observacao: atendimento?.observacaoConclusao ?? evento.observacao ?? ' ',
          clienteNome,
          projetoTitulo: '—',
          tarefaTitulo: evento.atendimentoTitulo ?? 'Sem título',
          descricao: atendimento?.descricao ?? null,
          concluidoPorId,
          concluidoPorNome,
          participantesIds,
          lancadoPorColaboradorId: atendimento?.cadastradoPorColaboradorId ?? null,
          lancadoPorNome: colaboradorNomePorId.get(atendimento?.cadastradoPorColaboradorId) ?? null,
          lancadoPorData: atendimento?.dataCadastro ? new Date(atendimento.dataCadastro) : null,
        });
      });

    return resultado;
  }, [eventosAtendimento, atendimentoPorId, colaboradorNomePorId, clientePorId, exibicaoNomeCliente]);

  // Eventos de mudança de etapa ('E') e de reatribuição de colaborador ('A') de cada tarefa,
  // em ordem cronológica — base para descobrir quem realmente ficou com cada etapa. Quando dois
  // eventos têm o mesmo DataHoraAcao (comuns: atribuição e mudança de etapa gravadas na mesma
  // ação do usuário), o Id (ordem de inserção) desempata — o sistema sempre grava a atribuição
  // antes da mudança de etapa quando as duas acontecem juntas.
  const eventosPorTarefa = useMemo(() => {
    const mapa = new Map();
    registrosTarefa
      .filter((item) => item.tipo === 'E' || item.tipo === 'A' || item.tipo === 'I')
      .forEach((item) => {
        if (!mapa.has(item.tarefaId)) mapa.set(item.tarefaId, []);
        mapa.get(item.tarefaId).push({
          id: item.id,
          tipo: item.tipo,
          dataHoraAcao: item.dataHoraAcao ? new Date(item.dataHoraAcao) : null,
          colaboradorId: item.colaboradorId ?? null,
          colaboradorNome: item.colaboradorNome ?? null,
          etapaId: item.etapaId ?? null,
          etapaNome: item.etapaNome ?? '—',
          elaboracaoJaIniciadaNoEvento: !!item.elaboracaoJaIniciadaNoEvento,
          observacao: item.observacao ?? null,
          clienteNome: resolverNomeCliente(item),
          projetoTitulo: item.projetoTitulo ?? '—',
          tarefaTitulo: item.tarefaTitulo ?? 'Sem título',
        });
      });
    mapa.forEach((eventos) =>
      eventos.sort((a, b) => (a.dataHoraAcao ?? 0) - (b.dataHoraAcao ?? 0) || (a.id ?? 0) - (b.id ?? 0))
    );
    return mapa;
  }, [registrosTarefa, exibicaoNomeCliente]);

  // Uma linha por passagem de etapa. O ponto-chave (visto direto no código do backend que grava
  // esses eventos, ProjetosController.MoverEtapa): o Colaborador gravado no evento 'E' (Mudança de
  // Etapa) é sempre quem estava responsável na etapa que está sendo DEIXADA (o valor "antes" da
  // troca), não quem está assumindo a nova etapa. Ou seja, cada evento 'E' fecha a etapa anterior
  // e credita ela ao colaborador do PRÓPRIO evento — e abre uma nova etapa, cujo responsável só é
  // conhecido pelos eventos 'A' (atribuição) seguintes, seja o que acompanha a própria mudança de
  // etapa (mesma ação do usuário) ou uma reatribuição avulsa feita depois, já dentro da etapa.
  // A última etapa (ainda "aberta", sem uma próxima mudança de etapa que a feche) é creditada ao
  // último responsável conhecido no fim do período. Passagens sem responsável ficam de fora:
  // relatório é base de cálculo de comissão, sem responsável não há comissão.
  const segmentos = useMemo(() => {
    const resultado = [];
    eventosPorTarefa.forEach((eventos, tarefaId) => {
      let etapaAberta = null; // { etapaNome, dataHoraAcao, ...contexto } — a etapa em andamento
      let colaboradorAtual = null; // último responsável conhecido (atualizado por qualquer evento 'A')

      const fecharEtapa = (colaborador) => {
        if (!etapaAberta || !colaborador?.colaboradorNome) return;

        // Elaboração que ficou reservada antes de começar: o período entre a entrada na etapa e
        // o início vira uma linha "Reservado", e a linha da elaboração passa a contar do início.
        const inicio = etapaAberta.inicioElaboracao;
        if (inicio) {
          const reservadoPor = etapaAberta.reservadoPor?.colaboradorNome ? etapaAberta.reservadoPor : colaborador;
          resultado.push({
            id: `${tarefaId}-${etapaAberta.id}-reservado`,
            itemTipo: 'tarefa',
            tarefaId,
            colaboradorId: reservadoPor.colaboradorId,
            colaboradorNome: reservadoPor.colaboradorNome,
            etapaId: null,
            etapaNome: ROTULO_RESERVADO,
            rawDataHoraAcao: etapaAberta.dataHoraAcao,
            dataHoraAcao: formatDateTime(etapaAberta.dataHoraAcao),
            observacao: ' ',
            clienteNome: etapaAberta.clienteNome,
            projetoTitulo: etapaAberta.projetoTitulo,
            tarefaTitulo: etapaAberta.tarefaTitulo,
          });
        }
        const dataElaboracao = inicio?.dataHoraAcao ?? etapaAberta.dataHoraAcao;

        resultado.push({
          id: `${tarefaId}-${etapaAberta.id}`,
          itemTipo: 'tarefa',
          tarefaId,
          colaboradorId: colaborador.colaboradorId,
          colaboradorNome: colaborador.colaboradorNome,
          etapaId: etapaAberta.etapaId,
          etapaNome: etapaAberta.etapaNome,
          rawDataHoraAcao: dataElaboracao,
          dataHoraAcao: formatDateTime(dataElaboracao),
          observacao: colaborador.observacao ?? ' ',
          clienteNome: etapaAberta.clienteNome,
          projetoTitulo: etapaAberta.projetoTitulo,
          tarefaTitulo: etapaAberta.tarefaTitulo,
        });
      };

      eventos.forEach((evento) => {
        if (evento.tipo === 'A') {
          colaboradorAtual = evento;
          return;
        }
        if (evento.tipo === 'I') {
          // Primeiro início de uma elaboração que entrou reservada; reinícios após pausa não contam.
          if (etapaAberta?.reservada && !etapaAberta.inicioElaboracao) {
            etapaAberta.inicioElaboracao = evento;
            etapaAberta.reservadoPor = colaboradorAtual;
          }
          return;
        }
        // evento.tipo === 'E': fecha a etapa em andamento, creditando ao colaborador do PRÓPRIO
        // evento 'E' (quem estava responsável antes desta troca — ver comentário acima)
        fecharEtapa(evento);
        etapaAberta = {
          ...evento,
          reservada: ehEtapaElaboracao(evento.etapaNome) && !evento.elaboracaoJaIniciadaNoEvento,
        };
      });

      // Etapa ainda aberta no fim do período: credita ao último responsável conhecido
      fecharEtapa(colaboradorAtual);
    });
    return resultado;
  }, [eventosPorTarefa]);

  // Tarefas cuja última etapa conhecida no período é a etapa final — calculado a partir de
  // `segmentos` (não filtrado por colaborador ainda), já que o último segmento de uma tarefa pode
  // ter ficado com um colaborador diferente do que está selecionado no filtro.
  const tarefasFinalizadas = useMemo(() => {
    if (!somenteConcluidas || !etapaFinalId) return null; // sem recorte: entram todas
    const ultimaEtapaPorTarefa = new Map();
    segmentos.forEach((segmento) => ultimaEtapaPorTarefa.set(segmento.tarefaId, segmento.etapaId));
    const set = new Set();
    ultimaEtapaPorTarefa.forEach((etapaId, tarefaId) => {
      if (etapaId === etapaFinalId) set.add(tarefaId);
    });
    return set;
  }, [segmentos, etapaFinalId, somenteConcluidas]);

  // Junta tarefas e atendimentos numa lista só — cada linha já carrega itemTipo, então o resto do
  // relatório trata os dois de forma uniforme.
  const linhasTarefasEAtendimentos = useMemo(
    () => [...segmentos, ...linhasAtendimento],
    [segmentos, linhasAtendimento]
  );

  // "Teste" não é um tipo de item: é a mesma lista de tarefas vista por outro ângulo — o crédito
  // de cada uma passa a ser de quem fez a etapa de teste, em vez de quem elaborou.
  const creditoPorTeste = tipoItem === 'teste';
  const tipoItemBase = creditoPorTeste ? 'tarefa' : tipoItem;
  const creditoDoGrupo = (grupo) =>
    creditoPorTeste
      ? { id: grupo.aprovadorId, nome: grupo.aprovadorNome }
      : { id: grupo.desenvolvedorId, nome: grupo.desenvolvedorNome };

  // Agrupamento base: um grupo por tarefa/atendimento. Dentro do grupo, as passagens com:
  //   - a linha de lançamento ("Atendimento") como primeira das tarefas;
  //   - etapas DUPLICADAS reduzidas à última ocorrência (uma etapa reaberta várias vezes aparece
  //     só na passagem mais recente);
  //   - o "Desenvolvedor" do item: para tarefa, o colaborador da última etapa de elaboração;
  //     para atendimento, quem concluiu.
  const grupos = useMemo(() => {
    const mapa = new Map();

    linhasTarefasEAtendimentos
      .filter((item) => item.itemTipo === 'atendimento' || !tarefasFinalizadas || tarefasFinalizadas.has(item.tarefaId))
      .filter((item) => tipoItemBase === 'todos' || item.itemTipo === tipoItemBase)
      .forEach((item) => {
        if (!mapa.has(item.tarefaId)) {
          mapa.set(item.tarefaId, {
            tarefaId: item.tarefaId,
            itemTipo: item.itemTipo,
            clienteNome: item.clienteNome,
            projetoTitulo: item.projetoTitulo,
            tarefaTitulo: item.tarefaTitulo,
            itens: [],
          });
        }
        mapa.get(item.tarefaId).itens.push(item);
      });

    const lista = Array.from(mapa.values());

    lista.forEach((grupo) => {
      // Ordem cronológica das etapas dentro do grupo é o que dá sentido à sequência (quem pegou
      // depois de quem) e é a base da deduplicação abaixo.
      grupo.itens.sort((a, b) => (a.rawDataHoraAcao ?? 0) - (b.rawDataHoraAcao ?? 0));

      // Remove etapas duplicadas, mantendo só a última ocorrência de cada etapa.
      if (grupo.itemTipo === 'tarefa') {
        const ultimaPorEtapa = new Map();
        grupo.itens.forEach((item) => {
          const chave = item.etapaId ?? item.etapaNome;
          ultimaPorEtapa.set(chave, item); // itens já ordenados: o último sobrescreve
        });
        grupo.itens = Array.from(ultimaPorEtapa.values()).sort(
          (a, b) => (a.rawDataHoraAcao ?? 0) - (b.rawDataHoraAcao ?? 0)
        );
      }

      const info = grupo.itemTipo === 'tarefa' ? infoPorTarefa.get(grupo.tarefaId) : null;

      // Descrição do item (não varia entre as etapas).
      grupo.descricao =
        grupo.itemTipo === 'tarefa'
          ? info?.descricao ?? null
          : grupo.itens.find((i) => i.descricao)?.descricao ?? null;

      // Tempos só existem para tarefa; atendimento não tem execução nem teste cadastrados.
      grupo.execucaoPrevistaMin = info?.execucaoPrevistaMin ?? 0;
      grupo.testePrevistoMin = info?.testePrevistoMin ?? 0;
      grupo.execucaoRealizadaMin = info?.execucaoRealizadaMin ?? 0;
      grupo.testeRealizadoMin = info?.testeRealizadoMin ?? 0;

      // Desenvolvedor do item — calculado antes de injetar a linha de lançamento.
      if (grupo.itemTipo === 'atendimento') {
        const ref = grupo.itens.find((i) => i.etapaNome === ETAPA_ATENDIMENTO_CONCLUIDO) ?? grupo.itens[0];
        // Quem concluiu é o crédito. Faltando o registro, cai no colaborador atribuído ao
        // atendimento — é quem o atendeu, e sem isso o item ficaria sem ninguém.
        const atribuido = ref?.participantesIds?.find((id) => id != null) ?? null;
        grupo.desenvolvedorId = ref?.concluidoPorId ?? atribuido;
        grupo.desenvolvedorNome =
          ref?.concluidoPorId != null
            ? ref.concluidoPorNome
            : colaboradorNomePorId.get(atribuido) ?? SEM_DESENVOLVEDOR;
      } else {
        // Caminho normal: quem fez a última passagem pela etapa de elaboração. Só vale passagem
        // com responsável: etapa sem ninguém não credita comissão a ninguém.
        const temResponsavel = (item) => item?.colaboradorId != null;
        const etapaDev = [...grupo.itens]
          .reverse()
          .find((item) => ehEtapaDesenvolvimento(item.etapaNome) && temResponsavel(item));

        // Nem toda tarefa passa pela elaboração: parte é resolvida direto em outra etapa (análise,
        // atualização) ou vai de Atendimento para a final. Sem fallback, essas caíam todas em
        // "Sem desenvolvedor" e sumiam da contagem, embora o histórico mostre quem fez.
        // Cascata: quem estava na etapa anterior à final; se foi direto para a final, quem estava
        // nela. Só sobra "Sem desenvolvedor" quando não há responsável em passagem nenhuma.
        const etapasPercorridas = [...grupo.itens].reverse();
        const referencia =
          etapaDev ??
          etapasPercorridas.find((item) => item.etapaId !== etapaFinalId && temResponsavel(item)) ??
          etapasPercorridas.find(temResponsavel) ??
          null;

        grupo.desenvolvedorId = referencia?.colaboradorId ?? null;
        grupo.desenvolvedorNome = referencia?.colaboradorNome ?? SEM_DESENVOLVEDOR;

        // Guarda de onde veio o crédito para montar, mais abaixo, a linha de elaboração — sem
        // ela o item fica sem a etapa que justifica a comissão de quem o fez.
        grupo.elaboracaoDeduzidaDe = !etapaDev && referencia?.colaboradorId != null ? referencia : null;
      }

      // Aprovador do item: colaborador da última passagem pela etapa de teste. Só tarefa —
      // atendimento não tem etapas.
      const etapaAprovacao =
        grupo.itemTipo === 'tarefa'
          ? [...grupo.itens].reverse().find((item) => etapaTesteIds.has(item.etapaId))
          : null;
      grupo.aprovadorId = etapaAprovacao?.colaboradorId ?? null;
      grupo.aprovadorNome = etapaAprovacao?.colaboradorNome ?? null;

      // Colaboradores que participaram do item: quem fez alguma etapa dela, quem a lançou e, no
      // atendimento, quem está atribuído. Não decide quais itens aparecem — isso é do crédito —;
      // serve de reserva para achar um responsável quando o item não aponta um.
      const participantes = new Set(
        grupo.itens.map((item) => item.colaboradorId).filter((id) => id != null)
      );

      // Linha de lançamento ("Atendimento") como primeira do grupo (tarefa e atendimento).
      const base = grupo.itens[0];
      (base?.participantesIds ?? []).forEach((id) => participantes.add(id));
      const lancado =
        grupo.itemTipo === 'tarefa'
          ? info && (info.lancadoPorNome || info.lancadoPorData)
            ? { id: info.lancadoPorColaboradorId, nome: info.lancadoPorNome, data: info.lancadoPorData }
            : null
          : base && (base.lancadoPorNome || base.lancadoPorData)
            ? { id: base.lancadoPorColaboradorId, nome: base.lancadoPorNome, data: base.lancadoPorData }
            : null;
      if (lancado) {
        if (lancado.id != null) participantes.add(lancado.id);
        grupo.itens.unshift({
          id: `${grupo.tarefaId}-lancamento`,
          itemTipo: grupo.itemTipo,
          tarefaId: grupo.tarefaId,
          colaboradorId: lancado.id,
          colaboradorNome: lancado.nome ?? 'Sem responsável',
          etapaId: null,
          etapaNome: ETAPA_LANCAMENTO,
          rawDataHoraAcao: lancado.data,
          dataHoraAcao: formatDateTime(lancado.data),
          observacao: ' ',
          clienteNome: grupo.clienteNome,
          projetoTitulo: grupo.projetoTitulo,
          tarefaTitulo: grupo.tarefaTitulo,
          descricao: grupo.descricao,
        });
      }

      // Tarefa que não passou pela elaboração: o trabalho aconteceu em outra etapa (análise,
      // atualização) ou entre a abertura e a conclusão. A linha de elaboração é montada aqui,
      // com quem foi creditado, para o item mostrar a etapa que justifica a comissão. A etapa
      // real de onde veio o crédito continua na lista, logo acima — nada do histórico some.
      const deduzida = grupo.elaboracaoDeduzidaDe;
      if (deduzida) {
        const linhaElaboracao = {
          id: `${grupo.tarefaId}-elaboracao-deduzida`,
          itemTipo: grupo.itemTipo,
          tarefaId: grupo.tarefaId,
          colaboradorId: deduzida.colaboradorId,
          colaboradorNome: deduzida.colaboradorNome,
          etapaId: null,
          etapaNome: nomeEtapaElaboracao,
          rawDataHoraAcao: deduzida.rawDataHoraAcao,
          dataHoraAcao: deduzida.dataHoraAcao,
          observacao: `Sem passagem pela elaboração — creditado pela etapa ${deduzida.etapaNome}`,
          clienteNome: grupo.clienteNome,
          projetoTitulo: grupo.projetoTitulo,
          tarefaTitulo: grupo.tarefaTitulo,
          descricao: grupo.descricao,
        };
        // Entra antes da etapa final, que é onde a elaboração termina; sem etapa final na lista,
        // vai para o fim.
        const posicaoFinal = grupo.itens.findIndex((item) => item.etapaId === etapaFinalId);
        if (posicaoFinal >= 0) grupo.itens.splice(posicaoFinal, 0, linhaElaboracao);
        else grupo.itens.push(linhaElaboracao);
      }

      grupo.participantesIds = participantes;

      // Data de conclusão do item = a mais recente das passagens. Tem de ser o máximo, e não a
      // última linha, porque a ordem de exibição segue o fluxo e não o relógio.
      grupo.dataConclusao = grupo.itens.reduce(
        (maior, item) => (item.rawDataHoraAcao > (maior ?? 0) ? item.rawDataHoraAcao : maior),
        null
      );

      // Exibição na ordem do fluxo; entre linhas da mesma etapa, a mais antiga primeiro.
      if (grupo.itemTipo === 'tarefa') {
        grupo.itens.sort(
          (a, b) =>
            ordemDaLinha(a) - ordemDaLinha(b) || (a.rawDataHoraAcao ?? 0) - (b.rawDataHoraAcao ?? 0)
        );
      }
    });

    // Item sem ninguém a creditar (nenhuma passagem teve responsável) fica de fora: o
    // relatório é de comissão, e um item que não rende comissão a ninguém só atrapalharia a
    // conferência. É falha de cadastro da tarefa, não do relatório.
    // Em "Teste", quem não passou pela etapa de teste também fica de fora, pela mesma razão:
    // ninguém a testou, então ela não rende comissão de teste.
    return lista.filter((grupo) => creditoDoGrupo(grupo).id != null);
  }, [linhasTarefasEAtendimentos, tarefasFinalizadas, tipoItemBase, creditoPorTeste, infoPorTarefa, etapaTesteIds, etapaFinalId, nomeEtapaElaboracao, ordemPorEtapaId, ordemEtapaElaboracao, colaboradorNomePorId]);

  return {
    grupos,
    creditoDoGrupo,
    creditoPorTeste,
    tipoItemBase,
    colaboradorNomePorId,
    etapaFinalId,
    etapaTesteIds,
    nomeEtapaElaboracao,
  };
}
