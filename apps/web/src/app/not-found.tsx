import { Compass } from 'lucide-react'
import Link from 'next/link'
import { EmptyState, buttonClasses } from '@/components/ui'

export default function NotFound() {
  return (
    <div className="flex-1 min-h-[60vh] flex items-center justify-center px-4">
      <EmptyState
        icon={<Compass size={32} />}
        title="Página não encontrada"
        description="O endereço que você abriu não existe ou o conteúdo foi removido."
        action={
          <Link href="/profile" className={buttonClasses()}>
            Ir para o início
          </Link>
        }
      />
    </div>
  )
}
