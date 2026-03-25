import { prisma } from '@/lib/prisma';
import Link from 'next/link';

// Revalidar a rota sempre (não fazer cache) para vermos os dados reais da BD
export const dynamic = 'force-dynamic';

export default async function DebugPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams;
  const selectedOpeningId = resolvedSearchParams.openingId as string | undefined;

  // Busca apenas a lista de aberturas para o menu lateral
  const openingsList = await prisma.opening.findMany({
    select: { id: true, name: true }
  });

  // Busca a abertura selecionada com todos os detalhes aninhados
  let selectedOpening = null;
  
  if (selectedOpeningId || openingsList.length > 0) {
    const targetId = selectedOpeningId || openingsList[0].id;
    
    selectedOpening = await prisma.opening.findUnique({
      where: { id: targetId },
      include: {
        lessons: {
          include: {
            exercises: {
              include: {
                moves: {
                  include: {
                    children: {
                      include: {
                        children: {
                          include: {
                            children: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
  }

  return (
    <div className="min-h-screen bg-gray-900 text-green-400 font-mono text-sm flex flex-col">
      <div className="p-6 border-b border-gray-800 bg-gray-950">
        <h1 className="text-2xl text-white mb-2 font-bold">🛠️ Painel de Debug da Base de Dados</h1>
        <p className="text-gray-400">
          (Custo da operação do Gemini: ~ $0.15. Qualidade dos dados: Priceless)
        </p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Menu Lateral - Lista de Aberturas */}
        <div className="w-80 bg-gray-900 border-r border-gray-800 p-4 overflow-y-auto">
          <h2 className="text-white font-bold mb-4 uppercase tracking-wider text-xs">Aberturas Importadas</h2>
          
          {openingsList.length === 0 ? (
            <div className="text-gray-500 italic">Nenhuma abertura encontrada.</div>
          ) : (
            <ul className="space-y-2">
              {openingsList.map(op => (
                <li key={op.id}>
                  <Link 
                    href={`/debug?openingId=${op.id}`}
                    className={`block p-3 rounded-lg border transition-colors ${
                      selectedOpening?.id === op.id 
                        ? 'bg-green-900/20 border-green-500/50 text-green-300' 
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
                    }`}
                  >
                    {op.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          
          <div className="mt-8 pt-4 border-t border-gray-800">
            <Link 
              href="/admin/import" 
              className="text-blue-400 hover:text-blue-300 underline text-xs"
            >
              + Importar Nova Abertura
            </Link>
          </div>
        </div>

        {/* Área Principal - JSON Viewer */}
        <div className="flex-1 p-6 overflow-y-auto bg-[#0d1117]">
          {selectedOpening ? (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl text-white font-bold">{selectedOpening.name}</h2>
                <span className="bg-gray-800 text-gray-400 px-3 py-1 rounded text-xs border border-gray-700">
                  ID: {selectedOpening.id}
                </span>
              </div>
              <div className="bg-[#161b22] p-6 rounded-lg overflow-x-auto shadow-xl border border-gray-800">
                <pre className="text-[13px] leading-relaxed">
                  {JSON.stringify(selectedOpening, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>Selecione uma abertura no menu lateral para visualizar os dados.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
