'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Download, Loader2, Info, ShieldAlert } from 'lucide-react';
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
    <div className="min-h-screen bg-surface-app font-body">

      <header className="border-b border-border-subtle bg-surface-card/90 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 md:px-8 h-16 flex items-center gap-3">
          <Link
            href="/openings"
            className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-surface-sunken border border-border-default hover:border-border-strong text-ink-500 hover:text-ink-900 transition-all"
            title="Voltar à galeria"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <span className="text-[14px] font-semibold text-ink-700">Voltar à galeria</span>
          <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 bg-warning-soft border border-warning/20 rounded-lg">
            <ShieldAlert className="w-3.5 h-3.5 text-warning" />
            <span className="text-[11px] font-bold text-warning">Admin</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-8 py-10">
        <div className="bg-surface-card border border-border-default rounded-[16px] p-8 shadow-md">

          <div className="flex items-center gap-4 mb-2">
            <div className="bg-accent-soft p-3 rounded-[10px] text-accent">
              <Download className="w-6 h-6" />
            </div>
            <h1 className="font-display font-extrabold text-[28px] tracking-tight text-ink-900">Importador do Lichess</h1>
          </div>

          <p className="text-ink-500 text-[14px] mb-8 ml-[68px] leading-relaxed">
            Cole a URL de um estudo do Lichess para gerar lições interativas, análise tática e os comentários do Mestre Gambito.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5 ml-[68px]">
            <div>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-[8px] font-semibold text-[15px] transition-all flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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
          </form>

          {result && (
            <div className={`mt-8 ml-[68px] p-5 rounded-[10px] border animate-in fade-in slide-in-from-bottom-2 ${
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
      </main>
    </div>
  );
}
