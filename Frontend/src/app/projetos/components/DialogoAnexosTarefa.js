'use client';

import { useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Upload, Trash2, ZoomIn, Paperclip, FileText, Table2, FileCode, ChevronLeft, ChevronRight, Download, ExternalLink } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getAnexosTarefa, uploadAnexoTarefa, deletarAnexoTarefa, fetchAnexoComoBlob } from '../kanban/api/kanban';
import { useConfiguracoesSistema } from '../../../services/configuracoes/api';

const TIPOS_ACEITOS = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/xml',
  'application/xml',
  'application/x-ofx',
];

// .ret/.rem (REM e RET) não têm Content-Type padrão no navegador
// — são aceitos só pela extensão do arquivo.
const EXTENSOES_TEXTO_ACEITAS = ['.xml', '.ofx', '.ret', '.rem'];

const ACCEPT_INPUT = [...TIPOS_ACEITOS, ...EXTENSOES_TEXTO_ACEITAS].join(',');

function obterExtensao(nomeArquivo) {
  const idx = nomeArquivo.lastIndexOf('.');
  return idx === -1 ? '' : nomeArquivo.slice(idx).toLowerCase();
}

function isImagem(contentType) {
  return (contentType ?? '').startsWith('image/');
}

function isPdf(contentType) {
  return contentType === 'application/pdf';
}

function isExcel(contentType) {
  return (
    contentType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    contentType === 'application/vnd.ms-excel'
  );
}

function isArquivoTexto(contentType, nomeArquivo = '') {
  if (contentType === 'text/xml' || contentType === 'application/xml' || contentType === 'application/x-ofx') return true;
  return EXTENSOES_TEXTO_ACEITAS.includes(obterExtensao(nomeArquivo));
}

function AnexoImagem({ anexoId, nomeOriginal, className = '', onClick }) {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    let objectUrl = null;
    fetchAnexoComoBlob(anexoId)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => setSrc(null));
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [anexoId]);

  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded text-xs text-gray-400 ${className}`}>
        ...
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={nomeOriginal}
      className={`rounded ${className} ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
      onClick={onClick}
    />
  );
}

function AnexoPdf({ anexoId, nomeOriginal, className = '' }) {
  const handleAbrir = async () => {
    try {
      const blob = await fetchAnexoComoBlob(anexoId);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      // revoga após um tempo para não vazar memória
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast.error('Erro ao abrir o PDF.');
    }
  };

  return (
    <button
      type="button"
      onClick={handleAbrir}
      className={`flex flex-col items-center justify-center gap-1 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition-colors ${className}`}
      title={`Abrir ${nomeOriginal}`}
    >
      <FileText className="h-6 w-6 text-red-400" />
      <span className="text-xs text-red-500 font-medium px-1 text-center line-clamp-2 break-all">{nomeOriginal}</span>
    </button>
  );
}

function AnexoExcel({ anexoId, nomeOriginal, className = '' }) {
  const handleBaixar = async () => {
    try {
      const blob = await fetchAnexoComoBlob(anexoId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nomeOriginal;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast.error('Erro ao baixar o arquivo Excel.');
    }
  };

  return (
    <button
      type="button"
      onClick={handleBaixar}
      className={`flex flex-col items-center justify-center gap-1 bg-green-50 hover:bg-green-100 rounded border border-green-200 transition-colors ${className}`}
      title={`Baixar ${nomeOriginal}`}
    >
      <Table2 className="h-6 w-6 text-green-600" />
      <span className="text-xs text-green-700 font-medium px-1 text-center line-clamp-2 break-all">{nomeOriginal}</span>
    </button>
  );
}

function AnexoArquivoTexto({ anexoId, nomeOriginal, className = '' }) {
  const handleBaixar = async () => {
    try {
      const blob = await fetchAnexoComoBlob(anexoId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nomeOriginal;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast.error('Erro ao baixar o arquivo.');
    }
  };

  return (
    <button
      type="button"
      onClick={handleBaixar}
      className={`flex flex-col items-center justify-center gap-1 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors ${className}`}
      title={`Baixar ${nomeOriginal}`}
    >
      <FileCode className="h-6 w-6 text-blue-500" />
      <span className="text-xs text-blue-700 font-medium px-1 text-center line-clamp-2 break-all">{nomeOriginal}</span>
    </button>
  );
}

export default function DialogoAnexosTarefa({ open, onOpenChange, tarefaId, tarefaTitulo }) {
  const queryClient = useQueryClient();
  const inputRef = useRef(null);
  const [uploadando, setUploadando] = useState(false);
  const [imagemAmpliada, setImagemAmpliada] = useState(null);

  const { data: config } = useConfiguracoesSistema();

  const obterLimiteMB = (file) => {
    const ct = file.type;
    if (ct.startsWith('image/')) return config?.anexoLimiteImagemMB ?? config?.anexoTamanhoMaximoMB ?? 20;
    if (ct === 'application/pdf') return config?.anexoLimitePdfMB ?? config?.anexoTamanhoMaximoMB ?? 20;
    if (ct === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || ct === 'application/vnd.ms-excel')
      return config?.anexoLimiteExcelMB ?? config?.anexoTamanhoMaximoMB ?? 20;
    if (isArquivoTexto(ct, file.name)) return config?.anexoLimiteDocumentoMB ?? config?.anexoTamanhoMaximoMB ?? 20;
    return config?.anexoTamanhoMaximoMB ?? 20;
  };

  const { data: anexos = [] } = useQuery({
    queryKey: ['tarefa-anexos', tarefaId],
    queryFn: () => getAnexosTarefa(tarefaId),
    enabled: open && !!tarefaId,
  });

  const handleOpenChange = (v) => {
    if (!v) setImagemAmpliada(null);
    onOpenChange(v);
  };

  const handleSelecionarArquivo = async (e) => {
    const files = Array.from(e.target.files ?? []);
    if (inputRef.current) inputRef.current.value = '';
    if (!files.length) return;

    for (const file of files) {
      const aceito = TIPOS_ACEITOS.includes(file.type) || EXTENSOES_TEXTO_ACEITAS.includes(obterExtensao(file.name));
      if (!aceito) {
        toast.error(`Tipo não permitido: ${file.name}`);
        return;
      }
      const limiteMB = obterLimiteMB(file);
      if (file.size > limiteMB * 1024 * 1024) {
        toast.error(`"${file.name}" excede o limite de ${limiteMB} MB para este tipo.`);
        return;
      }
    }

    setUploadando(true);
    try {
      for (const file of files) {
        await uploadAnexoTarefa(tarefaId, file);
      }
      queryClient.invalidateQueries({ queryKey: ['tarefa-anexos', tarefaId] });
      toast.success(files.length === 1 ? 'Arquivo anexado.' : `${files.length} arquivos anexados.`);
    } catch (err) {
      toast.error(err.message ?? 'Erro ao fazer upload.');
    } finally {
      setUploadando(false);
    }
  };

  const handleDeletar = async (anexoId) => {
    try {
      await deletarAnexoTarefa(anexoId);
      queryClient.invalidateQueries({ queryKey: ['tarefa-anexos', tarefaId] });
      if (imagemAmpliada?.id === anexoId) setImagemAmpliada(null);
      toast.success('Arquivo removido.');
    } catch (err) {
      toast.error(err.message ?? 'Erro ao remover arquivo.');
    }
  };

  // Imagens ampliadas: da para passar de uma para outra sem voltar a grade.
  const imagens = anexos.filter((a) => isImagem(a.contentType));
  const indiceAmpliada = imagemAmpliada ? imagens.findIndex((a) => a.id === imagemAmpliada.id) : -1;

  const irParaImagem = (passo) => {
    if (imagens.length < 2 || indiceAmpliada < 0) return;
    const proximo = (indiceAmpliada + passo + imagens.length) % imagens.length;
    setImagemAmpliada(imagens[proximo]);
  };

  // As setas trocam de imagem. O Esc fica por conta do Radix, que fecha o diálogo de cima — a
  // ampliação — e deixa o de arquivos aberto.
  // Sem lista de dependencias de proposito: o handler precisa enxergar a imagem atual.
  useEffect(() => {
    if (!imagemAmpliada) return undefined;
    const aoTeclar = (e) => {
      if (e.key === 'ArrowRight') irParaImagem(1);
      else if (e.key === 'ArrowLeft') irParaImagem(-1);
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  });

  const abrirImagemEmNovaAba = async (anexoId) => {
    try {
      const blob = await fetchAnexoComoBlob(anexoId);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast.error('Erro ao abrir a imagem.');
    }
  };

  const baixarImagem = async (anexoId, nomeOriginal) => {
    try {
      const blob = await fetchAnexoComoBlob(anexoId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = nomeOriginal;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast.error('Erro ao baixar a imagem.');
    }
  };

  return (
    <>
      <Dialog.Root open={open} onOpenChange={handleOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[55]" />
          <Dialog.Content aria-describedby={undefined} className="fixed z-[55] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-gray-400" />
                <div>
                  <Dialog.Title className="text-sm font-semibold text-gray-900">
                    Arquivos da tarefa
                  </Dialog.Title>
                  {tarefaTitulo && (
                    <p className="text-xs text-gray-500 truncate max-w-xs">{tarefaTitulo}</p>
                  )}
                </div>
              </div>
              <Dialog.Close asChild>
                <button className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {anexos.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Nenhum arquivo anexado ainda.</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {anexos.map((anexo) => (
                    <div key={anexo.id} className="relative group aspect-square">
                      {isPdf(anexo.contentType) ? (
                        <AnexoPdf
                          anexoId={anexo.id}
                          nomeOriginal={anexo.nomeOriginal}
                          className="w-full h-full"
                        />
                      ) : isExcel(anexo.contentType) ? (
                        <AnexoExcel
                          anexoId={anexo.id}
                          nomeOriginal={anexo.nomeOriginal}
                          className="w-full h-full"
                        />
                      ) : isArquivoTexto(anexo.contentType, anexo.nomeOriginal) ? (
                        <AnexoArquivoTexto
                          anexoId={anexo.id}
                          nomeOriginal={anexo.nomeOriginal}
                          className="w-full h-full"
                        />
                      ) : (
                        <AnexoImagem
                          anexoId={anexo.id}
                          nomeOriginal={anexo.nomeOriginal}
                          className="w-full h-full object-cover"
                          onClick={() => setImagemAmpliada(anexo)}
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeletar(anexo.id)}
                        className="absolute top-1 right-1 hidden group-hover:flex items-center justify-center w-5 h-5 bg-red-600 text-white rounded-full shadow"
                        title="Remover"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                      {!isPdf(anexo.contentType) && !isExcel(anexo.contentType) && !isArquivoTexto(anexo.contentType, anexo.nomeOriginal) && (
                        <button
                          type="button"
                          onClick={() => setImagemAmpliada(anexo)}
                          className="absolute bottom-1 right-1 hidden group-hover:flex items-center justify-center w-5 h-5 bg-black/60 text-white rounded-full shadow"
                          title="Ampliar"
                        >
                          <ZoomIn className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t">
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPT_INPUT}
                multiple
                className="hidden"
                onChange={handleSelecionarArquivo}
              />
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploadando}
                className="w-full flex items-center justify-center gap-2 rounded-md border border-dashed border-gray-300 py-2.5 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors disabled:opacity-50"
              >
                <Upload className="h-4 w-4" />
                {uploadando ? 'Enviando...' : 'Adicionar arquivo'}
              </button>
              <p className="text-xs text-gray-400 text-center mt-1.5">
                JPEG, PNG, GIF, WebP, PDF, Excel (XLS/XLSX), XML, OFX, REM ou RET · máx. {config?.anexoTamanhoMaximoMB ?? 20} MB
              </p>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Imagem ampliada em diálogo próprio, e não dentro do diálogo de arquivos: aquela caixa é
          centralizada com transform, e um ancestral transformado vira o container do `position:
          fixed` — a imagem ficava presa ao tamanho da caixa e passava por cima dos botões. */}
      <Dialog.Root open={!!imagemAmpliada} onOpenChange={(v) => { if (!v) setImagemAmpliada(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/90 z-[70]" />
          <Dialog.Content
            aria-describedby={undefined}
            className="fixed inset-0 z-[75] flex flex-col focus:outline-none"
            onClick={() => setImagemAmpliada(null)}
          >
            <Dialog.Title className="sr-only">{imagemAmpliada?.nomeOriginal ?? 'Imagem'}</Dialog.Title>

            <div
              className="flex items-center gap-2 px-4 py-2 text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="flex-1 truncate text-sm" title={imagemAmpliada?.nomeOriginal}>
                {imagemAmpliada?.nomeOriginal}
              </p>
              {imagens.length > 1 && (
                <span className="text-xs opacity-70 shrink-0">
                  {indiceAmpliada + 1} de {imagens.length}
                </span>
              )}
              <button
                type="button"
                onClick={() => imagemAmpliada && abrirImagemEmNovaAba(imagemAmpliada.id)}
                className="p-1.5 rounded hover:bg-white/15 transition-colors"
                title="Abrir em nova aba"
              >
                <ExternalLink className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => imagemAmpliada && baixarImagem(imagemAmpliada.id, imagemAmpliada.nomeOriginal)}
                className="p-1.5 rounded hover:bg-white/15 transition-colors"
                title="Baixar"
              >
                <Download className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setImagemAmpliada(null)}
                className="p-1.5 rounded hover:bg-white/15 transition-colors"
                title="Fechar (Esc)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 min-h-0 flex items-center justify-center gap-2 px-2 pb-4">
              {imagens.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); irParaImagem(-1); }}
                  className="shrink-0 p-2 rounded-full text-white hover:bg-white/15 transition-colors"
                  title="Anterior (seta esquerda)"
                >
                  <ChevronLeft className="h-7 w-7" />
                </button>
              )}
              <div
                className="flex-1 min-w-0 h-full flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                {imagemAmpliada && (
                  <AnexoImagem
                    key={imagemAmpliada.id}
                    anexoId={imagemAmpliada.id}
                    nomeOriginal={imagemAmpliada.nomeOriginal}
                    className="max-h-full max-w-full object-contain"
                  />
                )}
              </div>
              {imagens.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); irParaImagem(1); }}
                  className="shrink-0 p-2 rounded-full text-white hover:bg-white/15 transition-colors"
                  title="Próxima (seta direita)"
                >
                  <ChevronRight className="h-7 w-7" />
                </button>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
