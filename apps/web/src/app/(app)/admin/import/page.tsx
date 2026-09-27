'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Download, Loader2, Info, ShieldAlert } from 'lucide-react';
import { PageBody, PageHeader, PageTitle } from '@/components/layout/Page';
import { importStudyAction } from '@/app/actions/ingest.actions';

function validateUrl(val: string) {
  if (!val) return 'A URL é obrigatória.';
  if (!val.startsWith('https://lichess.org/study/')) {
    return 'Deve ser uma URL de estudo do Lichess (https://lichess.org/study/...).';
  }
  return '';
}

const inputClass = "w-full bg-surface-app border border-border-default rounded-[8px] px-4 py-2.5 text-[14px] text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all";
const selectClass = "w-full bg-surface-app border border-border-default rounded-[8px] px-4 py-2.5 text-[14px] text-ink-900 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all";

export default function ImportPage() {
  const [url, setUrl] = useState('');
  const [openingName, setOpeningName] = useState('');
  const [specificChapter, setSpecificChapter] = useState('');
  const [chapterLimit, setChapterLimit] = useState('');
  const [styleTag, setStyleTag] = useState('');
  // On by default: the reviewed-study flow. Off, the AI coach rewrites every comment.
  const [useAuthorComments, setUseAuthorComments] = useState(true);
  const [loading, setLoading] = useState(false);
  const [urlError, setUrlError] = useState('');
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);

  const handleUrlBlur = () => {
    setUrlError(validateUrl(url));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateUrl(url);
    if (err) {
      setUrlError(err);
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const data = await importStudyAction({
        url,
        openingName: openingName || undefined,
        specificChapter: specificChapter ? Number(specificChapter) : undefined,
        chapterLimit: chapterLimit ? Number(chapterLimit) : undefined,
        styleTags: styleTag ? [styleTag] : [],
        useAuthorComments,
      });

      if (!data.success) {
        throw new Error(data.error || 'Falha na importação');
      }

      setResult({ success: true, message: data.message });
      setUrl('');
      setOpeningName('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ocorreu um erro inesperado';
      setResult({ success: false, error: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1">
      <PageHeader>
        <PageTitle subtitle="Administração">Importador do Lichess</PageTitle>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-warning-soft border border-warning/20 rounded-lg text-[11px] font-bold text-warning shrink-0">
          <ShieldAlert className="w-3.5 h-3.5" />
          Admin
        </span>
      </PageHeader>

      <PageBody>
        <div className="@container bg-surface-card border border-border-default rounded-[16px] p-5 sm:p-8 shadow-md">

          <div className="flex items-start gap-4 mb-8">
            <div className="bg-accent-soft p-3 rounded-[10px] text-accent shrink-0">
              <Download className="w-6 h-6" />
            </div>
            <p className="text-ink-500 text-[14px] leading-relaxed max-w-2xl">
              Cole a URL de um estudo do Lichess para gerar lições interativas, análise tática e os comentários do Mestre Gambito.
            </p>
          </div>

          {/* Fields reflow with the space: one column on a phone, two, then four on wide screens. */}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 @2xl:grid-cols-2 @6xl:grid-cols-4 gap-5">
            <div className="@2xl:col-span-2">
              <label className="block text-[13px] font-semibold text-ink-700 mb-1.5">
                URL do estudo do Lichess *
              </label>
              <input
                type="url"
                required
                placeholder="https://lichess.org/study/xxxxxx"
                className={`${inputClass} ${urlError ? 'border-danger ring-2 ring-danger/20' : ''}`}
                value={url}
                onChange={e => {
                  setUrl(e.target.value);
                  if (urlError) setUrlError(validateUrl(e.target.value));
                }}
                onBlur={handleUrlBlur}
              />
              {urlError ? (
                <p className="mt-1.5 text-[12px] text-danger font-medium">{urlError}</p>
              ) : (
                <div className="flex items-center gap-1.5 mt-2 text-[12px] text-ink-400">
                  <Info className="w-3.5 h-3.5" />
                  <p>Deve ser uma URL de estudo público do Lichess.</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-ink-700 mb-1.5">
                Nome da abertura <span className="text-ink-400 font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                placeholder="Ex.: Ruy Lopez (Variante da Troca)"
                className={inputClass}
                value={openingName}
                onChange={e => setOpeningName(e.target.value)}
              />
              <div className="flex items-center gap-1.5 mt-2 text-[12px] text-ink-400">
                <Info className="w-3.5 h-3.5" />
                <p>Se deixar em branco, usaremos o nome do primeiro capítulo.</p>
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-ink-700 mb-1.5">
                Tag de estilo de jogo <span className="text-ink-400 font-normal">(opcional)</span>
              </label>
              <select
                className={selectClass}
                value={styleTag}
                onChange={e => setStyleTag(e.target.value)}
              >
                <option value="">Selecione um estilo...</option>
                <option value="Aggressive">Agressivo (Tático e afiado)</option>
                <option value="Solid">Sólido (Seguro e defensivo)</option>
                <option value="Positional">Posicional (Estratégico e de manobra)</option>
                <option value="Universal">Universal (Flexível)</option>
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-ink-700 mb-1.5">
                Capítulo específico <span className="text-ink-400 font-normal">(opcional)</span>
              </label>
              <input
                type="number"
                min="1"
                placeholder="Ex.: 2"
                className={inputClass}
                value={specificChapter}
                onChange={e => setSpecificChapter(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-ink-700 mb-1.5">
                Limite de capítulos <span className="text-ink-400 font-normal">(opcional)</span>
              </label>
              <input
                type="number"
                min="1"
                placeholder="Ex.: 3"
                className={inputClass}
                value={chapterLimit}
                onChange={e => setChapterLimit(e.target.value)}
              />
            </div>

            <label className="col-span-full flex items-start gap-3 rounded-[10px] border border-border-default bg-surface-app p-4 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-accent"
                checked={useAuthorComments}
                onChange={e => setUseAuthorComments(e.target.checked)}
              />
              <span>
                <span className="block text-[14px] font-semibold text-ink-900">Usar os comentários do estudo como estão</span>
                <span className="block text-[12px] text-ink-500 mt-0.5 leading-relaxed">
                  Para estudos revisados por você (inclusive os gerados pelo lesson-author). Estudos com marcas{' '}
                  <code className="font-mono">[REVISAR</code> são recusados. Desmarcado, o treinador de IA reescreve os comentários.
                </span>
              </span>
            </label>

            <p className="col-span-full flex items-start gap-1.5 text-[12px] text-ink-500">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              Reimportar uma abertura que já existe substitui as lições dela, e o progresso dos alunos nessas lições é zerado.
            </p>

            <div className="col-span-full flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full @2xl:w-auto @2xl:px-8 py-3.5 rounded-[8px] font-semibold text-[15px] transition-all flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    O Mestre Gambito está analisando...
                  </>
                ) : (
                  'Importar e gerar lições'
                )}
              </button>
            </div>
          </form>

          {result && (
            <div className={`mt-8 p-5 rounded-[10px] border animate-in fade-in slide-in-from-bottom-2 ${
              result.success
                ? 'bg-success-soft border-[#2EA05D]/20 text-success'
                : 'bg-danger-soft border-[#E0483D]/20 text-danger'
            }`}>
              <p className="font-bold text-[16px]">
                {result.success ? 'Sucesso!' : 'Ocorreu um erro'}
              </p>
              <p className="mt-2 text-ink-700 text-[14px]">{result.message || result.error}</p>
              {result.success && (
                <div className="mt-4">
                  <Link href="/openings" className="text-[13px] font-semibold text-accent hover:underline underline-offset-4">
                    &larr; Voltar à galeria
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </PageBody>
    </div>
  );
}
