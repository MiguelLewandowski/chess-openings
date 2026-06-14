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
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-violet-500/30">

      <header className="border-b border-white/5 bg-slate-950/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 md:px-8 h-16 flex items-center gap-4">
          <Link
            href="/openings"
            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-all"
            title="Voltar à galeria"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <span className="font-medium text-slate-200">Voltar à galeria</span>
          <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-bold text-amber-400">Admin</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-8 py-12">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-black/20">

          <div className="flex items-center gap-4 mb-2">
            <div className="bg-violet-500/10 p-3 rounded-xl text-violet-400">
              <Download className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-100">Importador do Lichess</h1>
          </div>

          <p className="text-slate-400 mb-8 ml-14">
            Cole a URL de um estudo do Lichess para gerar lições interativas, análise tática e os comentários do Mestre Gambito.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6 ml-14">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                URL do estudo do Lichess *
              </label>
              <input
                type="url"
                required
                placeholder="https://lichess.org/study/xxxxxx"
                className={`w-full bg-slate-950 border rounded-xl p-3.5 text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all ${
                  urlError ? 'border-rose-500' : 'border-slate-800'
                }`}
                value={url}
                onChange={e => {
                  setUrl(e.target.value);
                  if (urlError) setUrlError(validateUrl(e.target.value));
                }}
                onBlur={handleUrlBlur}
              />
              {urlError ? (
                <p className="mt-1.5 text-xs text-rose-400 font-medium">{urlError}</p>
              ) : (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
                  <Info className="w-3.5 h-3.5" />
                  <p>Deve ser uma URL de estudo público do Lichess.</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Nome da abertura <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                placeholder="Ex.: Ruy Lopez (Variante da Troca)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
                value={openingName}
                onChange={e => setOpeningName(e.target.value)}
              />
              <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
                <Info className="w-3.5 h-3.5" />
                <p>Se deixar em branco, usaremos o nome do primeiro capítulo.</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Tag de estilo de jogo <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <select
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-slate-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Capítulo específico <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Ex.: 2"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
                  value={specificChapter}
                  onChange={e => setSpecificChapter(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Limite de capítulos <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Ex.: 3"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
                  value={chapterLimit}
                  onChange={e => setChapterLimit(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                loading
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                  : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/25 active:scale-[0.98]'
              }`}
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
            <div className={`mt-8 ml-14 p-5 rounded-xl border animate-in fade-in slide-in-from-bottom-2 ${
              result.success
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
            }`}>
              <p className="font-semibold text-lg">
                {result.success ? '✅ Sucesso!' : '❌ Ocorreu um erro'}
              </p>
              <p className="mt-2 text-slate-300">{result.message || result.error}</p>
              {result.success && (
                <div className="mt-4 flex gap-4">
                  <Link href="/openings" className="text-sm font-medium text-emerald-400 hover:text-emerald-300 underline underline-offset-4">
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
