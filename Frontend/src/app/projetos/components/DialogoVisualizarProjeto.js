'use client';

import { useState } from 'react';
import { Badge } from '../../../ui/base/badge';
import { Button } from '../../../ui/base/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../../ui/base/dialog';
import { Copy, FileText, FolderKanban, Loader2, Pencil, RefreshCw, RotateCcw, Trash2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { configuracoesPadrao, useConfiguracoesSistema } from '../../../shared/configuracoes-sistema/api';
import { obterLogotipo, obterRodapeRelatorio } from '../../../shared/configuracoes-sistema/reportBranding';
import { getProjetoDocumento } from '../api/projetos';

// ─── helpers ───────────────────────────────────────────────────────────────

function formatarDataHora(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatarData(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

function normalizarTexto(value) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function formatarDocumento(documento, tipoPessoa) {
  if (!documento) return '-';
  const d = documento.replace(/\D/g, '');
  if (tipoPessoa === 'F' && d.length === 11)
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  if (tipoPessoa === 'J' && d.length === 14)
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  return documento;
}

function montarEnderecoCliente(doc) {
  const partes = [
    doc.clienteLogradouro,
    doc.clienteNumero ? `nº ${doc.clienteNumero}` : null,
    doc.clienteBairro,
    doc.clienteCidade && doc.clienteUf ? `${doc.clienteCidade} - ${doc.clienteUf}` : doc.clienteCidade || doc.clienteUf,
    doc.clienteCep,
  ].filter(Boolean);
  return partes.length > 0 ? partes.join(', ') : '-';
}

// ─── PDF ───────────────────────────────────────────────────────────────────

const COR_PRIMARIA = [30, 58, 95];       // #1e3a5f
const COR_CABECALHO_TABELA = [241, 245, 249]; // #f1f5f9
const COR_TEXTO = [30, 30, 30];
const COR_MUTED = [100, 100, 100];
const COR_DIVISOR = [200, 210, 220];

async function gerarDocumentoPDF(projetoId, systemSettings) {
  const doc = await getProjetoDocumento(projetoId);
  if (!doc) throw new Error('Projeto não encontrado.');

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const larguraPagina = pdf.internal.pageSize.getWidth();
  const alturaPagina = pdf.internal.pageSize.getHeight();
  const margemEsq = 14;
  const margemDir = larguraPagina - 14;
  const larguraUtil = margemDir - margemEsq;

  const logoDataUrl = await obterLogotipo(systemSettings);
  const footerLines = obterRodapeRelatorio(systemSettings);
  const emissaoTexto = `Emitido em: ${formatarData(new Date())}`;
  const status = !doc.ativo ? 'Inativo' : doc.concluido ? 'Concluído' : 'Ativo';

  // ── função que desenha cabeçalho e rodapé em cada página ──
  function desenharCabecalhoRodape(pageNumber, pageCount) {
    // logo
    if (logoDataUrl) {
      pdf.addImage(logoDataUrl, 'PNG', larguraPagina - 52, 8, 38, 22);
    }

    // título do documento
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...COR_PRIMARIA);
    pdf.text('DOCUMENTO GERAL DO PROJETO', margemEsq, 17);

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...COR_MUTED);
    pdf.text(emissaoTexto, margemEsq, 23);

    // linha divisória sob cabeçalho (logo termina em y=30, linha fica em y=33)
    pdf.setDrawColor(...COR_DIVISOR);
    pdf.setLineWidth(0.4);
    pdf.line(margemEsq, 33, margemDir, 33);

    // rodapé
    const yRodape = alturaPagina - 8;
    pdf.setDrawColor(...COR_DIVISOR);
    pdf.line(margemEsq, yRodape - 3, margemDir, yRodape - 3);

    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...COR_MUTED);

    const footerLeft = footerLines.join(' | ');
    pdf.text(footerLeft, margemEsq, yRodape);
    pdf.text(`Página ${pageNumber} de ${pageCount}`, margemDir, yRodape, { align: 'right' });
  }

  let cursorY = 37;

  // ── função auxiliar: título de seção ──
  function tituloSecao(texto, y) {
    pdf.setFillColor(...COR_PRIMARIA);
    pdf.rect(margemEsq, y, larguraUtil, 6, 'F');
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(texto.toUpperCase(), margemEsq + 3, y + 4.2);
    return y + 9;
  }

  // ── função auxiliar: campo rotulo + valor ──
  function campo(rotulo, valor, x, y, largura) {
    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...COR_MUTED);
    pdf.text(rotulo, x, y);

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...COR_TEXTO);
    const linhas = pdf.splitTextToSize(valor || '-', largura);
    pdf.text(linhas, x, y + 4.5);
    return linhas.length * 4.5;
  }

  // ── SEÇÃO 1: Identificação do Projeto ──────────────────────────────────
  cursorY = tituloSecao('1. Identificação do Projeto', cursorY);

  const col1 = margemEsq;
  const col2 = margemEsq + larguraUtil * 0.35;
  const col3 = margemEsq + larguraUtil * 0.68;
  const largCol1 = larguraUtil * 0.32;
  const largCol2 = larguraUtil * 0.30;
  const largCol3 = larguraUtil * 0.30;

  const alturaCampo1 = campo('Nº do Projeto', `#${doc.id}`, col1, cursorY, largCol1);
  const alturaCampo2 = campo('Status', status, col2, cursorY, largCol2);
  campo('Data de Cadastro', formatarData(doc.dataCadastro), col3, cursorY, largCol3);
  cursorY += Math.max(alturaCampo1, 9) + 2;

  const alturaTitulo = campo('Título', doc.titulo, col1, cursorY, larguraUtil * 0.62);
  campo('Setor', doc.setorNome, col3, cursorY, largCol3);
  cursorY += Math.max(alturaTitulo, 9) + 2;

  campo('Lançado por', doc.cadastradoPorNome, col1, cursorY, larguraUtil * 0.62);
  cursorY += 11;

  if (doc.descricao) {
    campo('Descrição / Escopo', doc.descricao, col1, cursorY, larguraUtil);
    const linhasDesc = pdf.splitTextToSize(doc.descricao, larguraUtil);
    cursorY += linhasDesc.length * 4.5 + 6;
  } else {
    cursorY += 2;
  }

  // ── SEÇÃO 2: Dados do Contratante ───────────────────────────────────────
  cursorY = tituloSecao('2. Dados do Contratante', cursorY);

  const tipoLabel = doc.clienteTipoPessoa === 'J' ? 'Pessoa Jurídica' : 'Pessoa Física';
  const docLabel = doc.clienteTipoPessoa === 'J' ? 'CNPJ' : 'CPF';

  const alturaNome = campo('Nome / Razão Social', doc.clienteNome, col1, cursorY, larguraUtil * 0.62);
  campo(docLabel, formatarDocumento(doc.clienteDocumento, doc.clienteTipoPessoa), col3, cursorY, largCol3);
  cursorY += Math.max(alturaNome, 9) + 2;

  campo('Tipo', tipoLabel, col1, cursorY, largCol1);
  campo('E-mail', doc.clienteEmail || '-', col2, cursorY, largCol2);
  campo('Telefone', doc.clienteTelefone || '-', col3, cursorY, largCol3);
  cursorY += 11;

  campo('Endereço', montarEnderecoCliente(doc), col1, cursorY, larguraUtil);
  const linhasEnd = pdf.splitTextToSize(montarEnderecoCliente(doc), larguraUtil);
  cursorY += linhasEnd.length * 4.5 + 6;

  // ── SEÇÃO 3: Atividades ─────────────────────────────────────────────────
  cursorY = tituloSecao('3. Atividades do Projeto', cursorY);
  cursorY += 1;

  const tarefas = doc.tarefas ?? [];

  if (tarefas.length === 0) {
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(...COR_MUTED);
    pdf.text('Nenhuma atividade cadastrada.', margemEsq, cursorY + 5);
    cursorY += 10;
  } else {
    autoTable(pdf, {
      startY: cursorY,
      margin: { left: margemEsq, right: 14 },
      head: [['#', 'Atividade', 'Descrição', 'Prioridade', 'Responsável']],
      body: tarefas.map((t, i) => [
        i + 1,
        t.titulo,
        t.descricao || '-',
        t.prioridadeNome,
        t.colaboradorResponsavelNome || 'A definir',
      ]),
      headStyles: {
        fillColor: COR_PRIMARIA,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: { fontSize: 8, textColor: COR_TEXTO },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 44 },
        2: { cellWidth: 66 },
        3: { cellWidth: 26 },
        4: { cellWidth: 38 },
      },
      didDrawPage: () => {
        // cabeçalho/rodapé serão adicionados após a tabela
      },
    });
    cursorY = pdf.lastAutoTable.finalY + 8;
  }

  // ── SEÇÃO 4: Assinaturas ────────────────────────────────────────────────
  const alturaAssinaturas = 45;
  const paginaAtual = pdf.internal.getCurrentPageInfo().pageNumber;
  const totalPaginas = pdf.internal.getNumberOfPages();

  // garante espaço para assinaturas — se não couber, nova página
  if (cursorY + alturaAssinaturas > alturaPagina - 20) {
    pdf.addPage();
    cursorY = 37;
  }

  cursorY = tituloSecao('4. Assinaturas', cursorY);
  cursorY += 4;

  const largAssinatura = larguraUtil * 0.42;
  const xAssin1 = margemEsq;
  const xAssin2 = margemDir - largAssinatura;
  const yLinha = cursorY + 18;

  pdf.setDrawColor(...COR_TEXTO);
  pdf.setLineWidth(0.4);
  pdf.line(xAssin1, yLinha, xAssin1 + largAssinatura, yLinha);
  pdf.line(xAssin2, yLinha, xAssin2 + largAssinatura, yLinha);

  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...COR_TEXTO);
  pdf.text('Contratante', xAssin1 + largAssinatura / 2, yLinha + 4.5, { align: 'center' });
  pdf.text('Contratada', xAssin2 + largAssinatura / 2, yLinha + 4.5, { align: 'center' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(...COR_MUTED);
  pdf.text(doc.clienteNome, xAssin1 + largAssinatura / 2, yLinha + 9, { align: 'center' });

  const nomeEmpresa =
    systemSettings?.nomeFantasia || systemSettings?.razaoSocial || 'ASM Tasks';
  pdf.text(nomeEmpresa, xAssin2 + largAssinatura / 2, yLinha + 9, { align: 'center' });

  pdf.setFontSize(7);
  pdf.text(`Local e data: ____________________________`, xAssin1, yLinha + 18);
  pdf.text(`Local e data: ____________________________`, xAssin2, yLinha + 18);

  // ── Desenha cabeçalho/rodapé em todas as páginas ───────────────────────
  const numPaginas = pdf.internal.getNumberOfPages();
  for (let p = 1; p <= numPaginas; p++) {
    pdf.setPage(p);
    desenharCabecalhoRodape(p, numPaginas);
  }

  // nome do arquivo: projeto-<id>-<slug-titulo>.pdf
  const slug = doc.titulo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 40);

  pdf.save(`projeto-${doc.id}-${slug}.pdf`);
}

// ─── Componente ────────────────────────────────────────────────────────────

export default function DialogoVisualizarProjeto({
  open,
  onOpenChange,
  projeto,
  clientesById,
  setoresById,
  prioridadesById,
  colaboradoresById,
  etapasById,
  aoEditar,
  onInativar,
  onReativar,
  onDesmarcarConclusao,
  onDuplicar,
  isInativando,
  isReativando,
  isDesmarCando,
  isDuplicando,
}) {
  const [isEmitindo, setIsEmitindo] = useState(false);
  const { data: systemSettings = configuracoesPadrao } = useConfiguracoesSistema();

  if (!projeto) return null;

  const clienteNome = clientesById.get(projeto.clienteId) ?? `Cliente #${projeto.clienteId}`;
  const setorNome = setoresById.get(projeto.setorId) ?? `Setor #${projeto.setorId}`;
  const colaboradorCadastroNome =
    colaboradoresById.get(projeto.cadastradoPorColaboradorId) ??
    `Colaborador #${projeto.cadastradoPorColaboradorId}`;
  const status = !projeto.ativo ? 'Inativo' : projeto.concluido ? 'Concluido' : 'Ativo';
  const tarefas = [...(projeto.tarefas ?? [])].sort((a, b) => {
    const ordemA = prioridadesById.get(a.prioridadeId)?.ordem ?? 9999;
    const ordemB = prioridadesById.get(b.prioridadeId)?.ordem ?? 9999;
    return ordemA - ordemB;
  });

  const handleEdit = () => {
    onOpenChange(false);
    aoEditar(projeto);
  };

  const handleInativar = () => {
    onInativar(projeto.id);
    onOpenChange(false);
  };

  const handleReativar = () => {
    onReativar(projeto.id);
    onOpenChange(false);
  };

  const handleDesmarcarConclusao = () => {
    onDesmarcarConclusao(projeto.id);
    onOpenChange(false);
  };

  const handleDuplicar = () => {
    onOpenChange(false);
    onDuplicar(projeto);
  };

  const handleEmitirDocumento = async () => {
    setIsEmitindo(true);
    try {
      await gerarDocumentoPDF(projeto.id, systemSettings);
    } catch (err) {
      console.error('Erro ao gerar documento:', err);
    } finally {
      setIsEmitindo(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-[900px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-4 border-b shrink-0">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-brand-blue shrink-0" />
              <DialogTitle className="text-lg leading-tight">{projeto.titulo}</DialogTitle>
            </div>
            <Badge
              variant={projeto.ativo ? 'default' : 'secondary'}
              className={`shrink-0 ${
                status === 'Ativo'
                  ? 'bg-brand-blue hover:bg-brand-blue-dark'
                  : status === 'Concluido'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : ''
              }`}
            >
              {status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto flex-1">
          {/* Dados do projeto */}
          <div id="tour-view-projeto-dados" className="px-6 py-4 border-b">
            {projeto.descricao && (
              <p className="text-sm text-muted-foreground mb-3">{projeto.descricao}</p>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Cliente</p>
                <p className="font-medium">{clienteNome}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Setor</p>
                <p className="font-medium">{setorNome}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Data de cadastro</p>
                <p className="font-medium">{formatarDataHora(projeto.dataCadastro)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lançado por</p>
                <p className="font-medium">{colaboradorCadastroNome}</p>
              </div>
            </div>
          </div>

          {/* Tarefas */}
          <div id="tour-view-projeto-tarefas" className="px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">Tarefas</p>
              <Badge variant="outline">{tarefas.length} {tarefas.length === 1 ? 'tarefa' : 'tarefas'}</Badge>
            </div>

            {tarefas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma tarefa cadastrada.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {tarefas.map((task, index) => {
                  const prioridade = task.prioridadeId ? prioridadesById.get(task.prioridadeId) : null;
                  const prioridadeNome = prioridade?.nome ?? (task.prioridadeId ? `#${task.prioridadeId}` : null);
                  const prioridadeCor = prioridade?.cor;
                  const etapaNome = task.etapaId
                    ? (etapasById.get(task.etapaId) ?? `Etapa #${task.etapaId}`)
                    : 'Backlog';
                  const etapaConcluida = task.etapaId
                    ? normalizarTexto(etapasById.get(task.etapaId) ?? '').includes('conclu')
                    : false;

                  return (
                    <div
                      key={task.id || `${projeto.id}-${index}`}
                      className="rounded-md border-l-4 border border-l-[var(--p-cor)] bg-card p-3 flex flex-col gap-1.5"
                      style={{ '--p-cor': prioridadeCor ?? 'transparent' }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-snug">{task.titulo}</p>
                        <span className="text-xs font-medium bg-muted rounded px-1.5 py-0.5 text-muted-foreground shrink-0">
                          {index + 1}
                        </span>
                      </div>
                      {task.descricao && (
                        <p className="text-xs text-muted-foreground leading-snug">{task.descricao}</p>
                      )}
                      <div className="mt-auto pt-1 flex items-center justify-between gap-2">
                        {prioridadeNome ? (
                          <div className="flex items-center gap-1.5">
                            {prioridadeCor && (
                              <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: prioridadeCor }} />
                            )}
                            <span className="text-xs text-muted-foreground">{prioridadeNome}</span>
                          </div>
                        ) : <span />}
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${
                          etapaConcluida
                            ? 'bg-green-100 text-green-700'
                            : task.etapaId
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-muted text-muted-foreground'
                        }`}>
                          {etapaNome}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t gap-2 shrink-0">
          <Button
            variant="outline"
            className="text-emerald-700 border-emerald-600 hover:bg-emerald-600 hover:text-white"
            onClick={handleEmitirDocumento}
            disabled={isEmitindo}
          >
            {isEmitindo ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-1" />
            )}
            {isEmitindo ? 'Gerando...' : 'Emitir Documento'}
          </Button>

          <Button variant="outline" onClick={handleEdit}>
            <Pencil className="h-4 w-4 mr-1" />
            Editar
          </Button>

          <Button
            variant="outline"
            className="text-brand-blue border-brand-blue hover:bg-brand-blue hover:text-white"
            onClick={handleDuplicar}
            disabled={isDuplicando}
          >
            <Copy className="h-4 w-4 mr-1" />
            Duplicar
          </Button>

          {projeto.ativo && projeto.concluido && (
            <Button
              variant="outline"
              className="text-amber-600 border-amber-500 hover:bg-amber-50"
              onClick={handleDesmarcarConclusao}
              disabled={isDesmarCando}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reabrir projeto
            </Button>
          )}

          {projeto.ativo ? (
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={handleInativar}
              disabled={isInativando}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Inativar
            </Button>
          ) : (
            <Button
              variant="outline"
              className="text-green-600 border-green-600 hover:bg-green-600 hover:text-white"
              onClick={handleReativar}
              disabled={isReativando}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Reativar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
