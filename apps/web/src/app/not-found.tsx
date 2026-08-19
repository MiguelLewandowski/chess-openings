import { Compass } from 'lucide-react'
import Link from 'next/link'
import { EmptyState, buttonClasses } from '@/components/ui'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-app flex items-center justify-center">
      <EmptyState
        icon={<Compass size={32} />}
        title="Página não encontrada"
        description="O endereço que você abriu não existe ou o conteúdo foi removido."
        action={
          <Link href="/openings" className={buttonClasses()}>
            Ir para o catálogo
          </Link>
        }
      />
    </div>
  )
}
