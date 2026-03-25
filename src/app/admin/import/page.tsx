'use client';

import { useState } from 'react';

export default function ImportPage() {
  const [url, setUrl] = useState('');
  const [openingName, setOpeningName] = useState('');
  const [specificChapter, setSpecificChapter] = useState('');
  const [chapterLimit, setChapterLimit] = useState('');
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
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8 flex justify-center items-start">
      <div className="max-w-2xl w-full bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700">
        <h1 className="text-3xl font-bold text-white mb-2">📥 Importador Lichess</h1>
        <p className="text-gray-400 mb-8">
          Cole a URL de um estudo do Lichess para gerar as lições, análises táticas e comentários do Mestre Gambito.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* URL */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              URL do Estudo Lichess *
            </label>
            <input
              type="url"
              required
              placeholder="https://lichess.org/study/xxxxxx"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          {/* Nome da Abertura */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Nome da Abertura (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Ruy Lopez (Variante de Trocas)"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              value={openingName}
              onChange={(e) => setOpeningName(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">Se deixares em branco, usaremos o nome do primeiro capítulo.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Capítulo Específico */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Capítulo Específico
              </label>
              <input
                type="number"
                min="1"
                placeholder="Ex: 2"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                value={specificChapter}
                onChange={(e) => setSpecificChapter(e.target.value)}
              />
            </div>

            {/* Limite de Capítulos */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Limite de Capítulos
              </label>
              <input
                type="number"
                min="1"
                placeholder="Ex: 3"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                value={chapterLimit}
                onChange={(e) => setChapterLimit(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
              loading 
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-500 text-white shadow-[0_0_15px_rgba(22,163,74,0.4)]'
            }`}
          >
            {loading ? '🧠 Mestre Gambito a analisar...' : '🚀 Importar e Gerar Lições'}
          </button>
        </form>

        {/* Feedback de Resultado */}
        {result && (
          <div className={`mt-6 p-4 rounded-lg border ${
            result.success ? 'bg-green-900/30 border-green-800 text-green-300' : 'bg-red-900/30 border-red-800 text-red-300'
          }`}>
            <p className="font-semibold">{result.success ? '✅ Sucesso!' : '❌ Erro!'}</p>
            <p className="mt-1">{result.message || result.error}</p>
            {result.success && (
              <a href="/debug" target="_blank" className="inline-block mt-3 text-sm underline hover:text-green-200">
                Ver dados na página de Debug &rarr;
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
