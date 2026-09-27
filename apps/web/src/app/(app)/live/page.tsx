'use client'

import { Radio } from 'lucide-react'
import { useLiveFeed } from '@/hooks/useLiveFeed'
import { Badge, Card } from '@/components/ui'
import { PageBody, PageHeader, PageTitle } from '@/components/layout/Page'
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
    <div className="flex-1">
      <PageHeader>
        <PageTitle subtitle="Canais de destaque da Lichess TV">Partidas ao vivo</PageTitle>
        <Badge tone={connected ? 'success' : 'neutral'} className="shrink-0">
          <Radio className="w-3 h-3" />
          {connected ? 'Ao vivo' : 'Conectando…'}
        </Badge>
      </PageHeader>

      <PageBody>
        {!data ? (
          <p className="text-ink-500">Aguardando dados do servidor…</p>
        ) : (
          <ul className="grid grid-cols-1 @xl:grid-cols-2 @4xl:grid-cols-3 @7xl:grid-cols-4 gap-3 sm:gap-4">
            {Object.entries(data).map(([channel, game]) => (
              <li key={channel}>
                <Card className="h-full flex items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-accent uppercase tracking-wide truncate">{channel}</p>
                    <p className="text-[15px] font-semibold text-ink-900 truncate">
                      {game.user.title ? `${game.user.title} ` : ''}
                      {game.user.name}
                    </p>
                  </div>
                  <Badge tone="reward" className="shrink-0">{game.rating}</Badge>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </PageBody>
    </div>
  )
}
