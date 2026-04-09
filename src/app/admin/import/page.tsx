'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Download, Loader2, Info } from 'lucide-react';

export default function ImportPage() {
  const [url, setUrl] = useState('');
  const [openingName, setOpeningName] = useState('');
  const [specificChapter, setSpecificChapter] = useState('');
  const [chapterLimit, setChapterLimit] = useState('');
  const [styleTag, setStyleTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          openingName: openingName || undefined,
          specificChapter: specificChapter || undefined,
          chapterLimit: chapterLimit || undefined,
          styleTags: styleTag ? [styleTag] : [],
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao importar estudo');
      }

      setResult({ success: true, message: data.message });
      // Limpar form
      setUrl('');
      setOpeningName('');
    } catch (err: any) {
      setResult({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-violet-500/30">
      
      {/* Header */}
      <header className="border-b border-white/5 bg-slate-950/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 md:px-8 h-16 flex items-center">
          <Link 
            href="/openings" 
            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-all mr-4"
            title="Back to Gallery"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <span className="font-medium text-slate-200">Back to Gallery</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 md:px-8 py-12">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-black/20">
          
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-violet-500/10 p-3 rounded-xl text-violet-400">
              <Download className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-100">Lichess Importer</h1>
          </div>
          
          <p className="text-slate-400 mb-8 ml-14">
            Paste the URL of a Lichess study to generate interactive lessons, tactical analysis, and Master Gambito's comments.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6 ml-14">
            {/* URL */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Lichess Study URL *
              </label>
              <input
                type="url"
                required
                placeholder="https://lichess.org/study/xxxxxx"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

            {/* Nome da Abertura */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Opening Name <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="E.g.: Ruy Lopez (Exchange Variation)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
                value={openingName}
                onChange={(e) => setOpeningName(e.target.value)}
              />
              <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                <Info className="w-3.5 h-3.5" />
                <p>If left blank, we will use the first chapter's name.</p>
              </div>
            </div>

            {/* Estilo de Jogo (Tag) */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Playing Style Tag <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <select
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-slate-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
                value={styleTag}
                onChange={(e) => setStyleTag(e.target.value)}
              >
                <option value="">Select a style...</option>
                <option value="Aggressive">Aggressive (Tactical & Sharp)</option>
                <option value="Solid">Solid (Safe & Defensive)</option>
                <option value="Positional">Positional (Strategic & Maneuvering)</option>
                <option value="Universal">Universal (Flexible)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Capítulo Específico */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Specific Chapter <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="E.g.: 2"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
                  value={specificChapter}
                  onChange={(e) => setSpecificChapter(e.target.value)}
                />
              </div>

              {/* Limite de Capítulos */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Chapter Limit <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="E.g.: 3"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
                  value={chapterLimit}
                  onChange={(e) => setChapterLimit(e.target.value)}
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
                  Master Gambito is analyzing...
                </>
              ) : (
                'Import and Generate Lessons'
              )}
            </button>
          </form>

          {/* Feedback de Resultado */}
          {result && (
            <div className={`mt-8 ml-14 p-5 rounded-xl border animate-in fade-in slide-in-from-bottom-2 ${
              result.success 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
                : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
            }`}>
              <p className="font-semibold text-lg flex items-center gap-2">
                {result.success ? '✅ Success!' : '❌ An error occurred'}
              </p>
              <p className="mt-2 text-slate-300">{result.message || result.error}</p>
              {result.success && (
                <div className="mt-4 flex gap-4">
                  <Link href="/openings" className="text-sm font-medium text-emerald-400 hover:text-emerald-300 underline underline-offset-4">
                    &larr; Back to Gallery
                  </Link>
                  <Link href="/debug" className="text-sm font-medium text-slate-400 hover:text-slate-300 underline underline-offset-4">
                    View in Debug
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
