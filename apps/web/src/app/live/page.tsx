'use client'

import { Radio } from 'lucide-react'
import { useLiveFeed } from '@/hooks/useLiveFeed'
import { Badge, Card } from '@/components/ui'
interface TvChannel {
  user: { name: string; title?: string }
  rating: number
  gameId: string
}

type TvChannels = Record<string, TvChannel>

const WS_URL =  'ws://localhost:3001/live'

export default function LivePage() {
  const { data, connected } = useLiveFeed<TvChannels>(WS_URL)

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ink-900">Partidas em destaque no Lichess</h1>
        <Badge tone={connected ? 'success' : 'neutral'}>
          <Radio className="w-3 h-3" />
          {connected ? 'Ao vivo' : 'Conectando…'}
        </Badge>
      </header>

      {!data ? (
        <p className="text-ink-500">Aguardando dados do servidor…</p>
      ) : (
        <ul className="space-y-3">
          {Object.entries(data).map(([channel, game]) => (
            <li key={channel}>
              <Card className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-[13px] font-bold text-accent uppercase tracking-wide">{channel}</p>
                  <p className="text-[15px] font-semibold text-ink-900">
                    {game.user.title ? `${game.user.title} ` : ''}
                    {game.user.name}
                  </p>
                </div>
                <Badge tone="reward">{game.rating}</Badge>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
