import Link from 'next/link'
import { redirect } from 'next/navigation'
import { BookOpen, Brain, CalendarClock, Check, Clock, Flame, Play, Sparkles, Star, Trophy } from 'lucide-react'
import { practiceXp, type ContinueLesson, type OpeningProgress, type UserProfile } from '@chess-openings/domain'
import { apiClient } from '@/lib/api-client'
import { getSession } from '@/lib/session'
import { ARCHETYPES, isStyleArchetype } from '@/lib/archetypes'
import {
  formatMemberSince,
  formatNextReview,
  lessonShortTitle,
  levelTitle,
  percent,
  streakStatus,
  styleTagLabel,
  weekActivity,
  type StreakStatus,
} from '@/lib/profile'
import { MiniBoard } from '@/components/chess/MiniBoard'
import { Badge, Card, buttonClasses } from '@/components/ui'
import { PageBody, PageHeader, PageTitle } from '@/components/layout/Page'
import { cn } from '@/lib/cn'

const STREAK_HINT: Record<StreakStatus, { text: string; className: string }> = {
  none: { text: 'Conclua um exercício para começar sua sequência.', className: 'text-ink-500' },
  broken: { text: 'Sequência interrompida. Estude hoje para recomeçar.', className: 'text-danger' },
  'at-risk': { text: 'Estude hoje para não perder a sequência.', className: 'text-warning' },
  active: { text: 'Você já estudou hoje. Volte amanhã!', className: 'text-success' },
}

export default async function ProfilePage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const profile = await apiClient.progress.profile(session.apiToken)
  const displayName = profile.name || profile.email
  const firstName = profile.name?.split(' ')[0] ?? displayName

  return (
    <div className="flex-1">
      <PageHeader>
        <PageTitle subtitle={greetingSubtitle(profile)}>Bom jogo, {firstName}</PageTitle>
        <StreakPill streak={profile.streak} />
      </PageHeader>

      {/* On a phone the gamification cards come right after "continue", before the long
          openings list; from lg they move to a side column spanning both rows. The 1fr second
          row absorbs the side column's extra height, so "continue" keeps its natural size. */}
      <PageBody className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_360px] lg:grid-rows-[auto_1fr] lg:items-start">
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <ContinueCard lesson={profile.continueLesson} />
        </div>

        <aside className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 lg:col-start-2 lg:row-start-1 lg:row-span-2">
          <LevelCard profile={profile} />
          <StreakCard profile={profile} />
          <ReviewsCard reviews={profile.reviews} />
          <AccountCard profile={profile} displayName={displayName} />
        </aside>

        <div className="min-w-0 lg:col-start-1 lg:row-start-2">
          <OpeningsSection openings={profile.openings} />
        </div>
      </PageBody>
    </div>
  )
}

function greetingSubtitle(profile: UserProfile): string {
  const { due } = profile.reviews
  if (due > 0) return `Você tem ${due} ${due === 1 ? 'revisão esperando' : 'revisões esperando'} hoje`
  if (!profile.lastStudyDate) return 'Sua primeira lição está esperando'
  return 'Tudo em dia por hoje'
}

function StreakPill({ streak }: { streak: number }) {
  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-reward-soft text-reward-strong font-bold text-[13px] shrink-0"
      title="Dias seguidos de estudo"
    >
      <Flame className="w-4 h-4" />
      {streak} {streak === 1 ? 'dia' : 'dias'}
    </div>
  )
}

function ContinueCard({ lesson }: { lesson: ContinueLesson | null }) {
  if (!lesson) {
    return (
      <Card accent className="p-8 text-center">
        <p className="font-display font-bold text-[18px] text-ink-900">Nenhuma abertura no catálogo ainda</p>
        <p className="text-[14px] text-ink-500 mt-1">Assim que houver lições, elas aparecem aqui para você continuar.</p>
      </Card>
    )
  }

  const title = lessonShortTitle(lesson.lessonTitle, lesson.openingName)
  const href = `/lessons/${lesson.lessonId}`

  return (
    <Card accent elevation="raised" className="@container p-5 sm:p-6">
      <div className="flex flex-col @lg:flex-row gap-5 @lg:gap-6 @lg:items-center">
        <MiniBoard
          fen={lesson.fen}
          label={`Posição final da lição ${title}`}
          className="w-full max-w-60 mx-auto @lg:mx-0 @lg:w-44 @3xl:w-56 shrink-0"
        />

        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] font-bold tracking-[0.14em] uppercase text-accent">
            {lesson.hasProgress ? 'Continue de onde parou' : 'Comece por aqui'}
          </p>
          <h2 className="font-display font-extrabold text-[20px] @lg:text-[24px] @3xl:text-[28px] leading-tight tracking-tight text-ink-900 mt-1.5">
            {lesson.openingName} · {title}
          </h2>
          <p className="text-[14px] text-ink-500 leading-relaxed mt-2 max-w-md">
            {lesson.remainingLessons > 0
              ? lesson.remainingLessons === 1
                ? `Falta 1 lição para dominar a ${lesson.openingName}.`
                : `Faltam ${lesson.remainingLessons} lições para dominar a ${lesson.openingName}.`
              : `Você concluiu todas as lições de ${lesson.openingName}. Revise para fixar a teoria.`}
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-5">
            <Link href={href} className={buttonClasses({ size: 'lg', className: 'w-full @sm:w-auto' })}>
              <Play className="w-4 h-4 fill-current" />
              {lesson.hasProgress ? 'Continuar lição' : 'Começar lição'}
            </Link>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-reward-soft text-reward-strong text-[12px] font-bold">
              <Star className="w-3.5 h-3.5 fill-current" />
              Até {practiceXp(5)} XP por lição
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}

function OpeningsSection({ openings }: { openings: OpeningProgress[] }) {
  return (
    <section>
      <div className="flex items-end justify-between mb-4">
        <h2 className="font-display font-extrabold text-[20px] tracking-tight text-ink-900">Suas aberturas</h2>
        <Link href="/openings" className="text-[13px] font-semibold text-accent hover:underline underline-offset-4">
          Ver catálogo
        </Link>
      </div>

      {openings.length === 0 ? (
        <Card className="p-8 text-center text-[14px] text-ink-500">Nenhuma abertura no catálogo ainda.</Card>
      ) : (
        <div className="@container">
          <div className="grid grid-cols-1 @xl:grid-cols-2 @4xl:grid-cols-3 @7xl:grid-cols-4 gap-4">
            {openings.map((opening) => (
              <OpeningCard key={opening.id} opening={opening} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function OpeningCard({ opening }: { opening: OpeningProgress }) {
  const value = percent(opening.completedLessons, opening.totalLessons)
  const done = opening.totalLessons > 0 && opening.completedLessons === opening.totalLessons
  const tag = opening.styleTags[0]

  return (
    <Link href={`/openings/${opening.slug}`} className="group block">
      <Card className="p-5 h-full transition-all group-hover:shadow-md group-hover:border-border-default">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display font-bold text-[16px] tracking-tight text-ink-900 truncate">{opening.name}</p>
            {opening.firstMoves && (
              <p className="font-mono text-[12px] text-ink-400 mt-0.5 truncate">{opening.firstMoves}</p>
            )}
          </div>
          {tag && (
            <span className="shrink-0 px-2 py-1 rounded-[6px] border border-border-default text-[12px] font-semibold text-ink-600">
              {styleTagLabel(tag)}
            </span>
          )}
        </div>

        <ProgressBar
          value={value}
          barClassName={done ? 'bg-reward' : 'bg-accent'}
          label={`Progresso em ${opening.name}`}
          className="mt-4"
        />

        <p className="flex items-center gap-1.5 mt-3 text-[13px] text-ink-500">
          {done ? <Trophy className="w-4 h-4 text-reward-strong" /> : <Check className="w-4 h-4 text-success" />}
          <span className="font-semibold text-ink-700">{opening.completedLessons}</span> de {opening.totalLessons}{' '}
          {opening.totalLessons === 1 ? 'lição' : 'lições'}
          {done && <Badge tone="reward" className="ml-auto">Concluída</Badge>}
        </p>
      </Card>
    </Link>
  )
}

function LevelCard({ profile }: { profile: UserProfile }) {
  const { level, xpIntoLevel, xpForNextLevel } = profile.level
  const missing = xpForNextLevel - xpIntoLevel

  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 shrink-0 rounded-full bg-accent text-surface-card flex items-center justify-center font-display font-extrabold text-[20px] ring-4 ring-accent-soft">
          {level}
        </div>
        <div className="min-w-0">
          <p className="font-display font-bold text-[16px] text-ink-900">
            Nível {level} · {levelTitle(level)}
          </p>
          <p className="text-[12px] text-ink-500">
            Faltam {missing} XP para o Nível {level + 1}
          </p>
        </div>
      </div>

      <ProgressBar
        value={percent(xpIntoLevel, xpForNextLevel)}
        barClassName="bg-reward"
        label="Progresso até o próximo nível"
        className="mt-4"
      />
      <div className="flex items-center justify-between mt-2 font-mono text-[11px] text-ink-400">
        <span>
          {xpIntoLevel} / {xpForNextLevel} XP
        </span>
        <span>Total: {profile.xp} XP</span>
      </div>
    </Card>
  )
}

function StreakCard({ profile }: { profile: UserProfile }) {
  const hint = STREAK_HINT[streakStatus(profile.streak, profile.lastStudyDate)]
  const week = weekActivity(profile.lastStudyDate, profile.lastRunLength)

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="font-display font-bold text-[16px] text-ink-900">Sequência</p>
        <StreakPill streak={profile.streak} />
      </div>

      <ol className="grid grid-cols-7 gap-1 mt-4" aria-label="Dias estudados nesta semana">
        {week.map((day) => (
          <li key={day.name} className="flex flex-col items-center gap-1.5">
            <span
              aria-label={`${day.name}: ${day.studied ? 'estudou' : day.isFuture ? 'ainda não chegou' : 'não estudou'}`}
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center',
                day.studied && 'bg-reward text-surface-card shadow-sm',
                !day.studied && day.isToday && 'border-2 border-dashed border-reward bg-reward-subtle',
                !day.studied && !day.isToday && 'bg-surface-sunken',
              )}
            >
              {day.studied && <Flame className="w-4 h-4 fill-current" />}
            </span>
            <span className={cn('text-[11px] font-semibold', day.isToday ? 'text-ink-900' : 'text-ink-400')}>
              {day.label}
            </span>
          </li>
        ))}
      </ol>

      <p className={cn('text-[12px] leading-snug mt-4', hint.className)}>{hint.text}</p>
    </Card>
  )
}

function ReviewsCard({ reviews }: { reviews: UserProfile['reviews'] }) {
  return (
    <Card className="p-5">
      <p className="font-display font-bold text-[16px] text-ink-900">Revisões</p>
      <p className="text-[12px] text-ink-500">Agendadas pelo algoritmo SM-2</p>

      <ul className="mt-4 flex flex-col gap-3">
        <li className="flex items-center gap-3">
          <span
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
              reviews.due > 0 ? 'bg-reward-soft text-reward-strong' : 'bg-success-soft text-success',
            )}
          >
            {reviews.due > 0 ? <Clock className="w-4 h-4" /> : <Check className="w-4 h-4" />}
          </span>
          <span className="text-[13px] text-ink-500 flex-1">Pendentes agora</span>
          {reviews.due > 0 ? (
            <Link href="/openings" className={buttonClasses({ size: 'sm' })}>
              Revisar {reviews.due}
            </Link>
          ) : (
            <span className="text-[13px] font-semibold text-success">Em dia</span>
          )}
        </li>

        <li className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-accent-soft text-accent flex items-center justify-center shrink-0">
            <CalendarClock className="w-4 h-4" />
          </span>
          <span className="text-[13px] text-ink-500 flex-1">Próxima revisão</span>
          <span className="text-[13px] font-semibold text-ink-900">
            {reviews.nextReview ? formatNextReview(reviews.nextReview) : '—'}
          </span>
        </li>

        <li className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-surface-sunken text-ink-700 flex items-center justify-center shrink-0">
            <Brain className="w-4 h-4" />
          </span>
          <span className="text-[13px] text-ink-500 flex-1" title="Intervalo de revisão de 21 dias ou mais">
            Consolidados
          </span>
          <span className="text-[13px] font-semibold text-ink-900">
            {reviews.mastered}/{reviews.scheduled}
          </span>
        </li>
      </ul>
    </Card>
  )
}

function AccountCard({ profile, displayName }: { profile: UserProfile; displayName: string }) {
  const archetype = isStyleArchetype(profile.styleArchetype) ? ARCHETYPES[profile.styleArchetype] : null

  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <div
          aria-hidden
          className="w-11 h-11 shrink-0 rounded-full bg-ink-900 text-surface-card flex items-center justify-center font-display font-bold text-[17px]"
        >
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-[14px] text-ink-900 truncate">{displayName}</p>
          {profile.name && <p className="text-[12px] text-ink-500 truncate">{profile.email}</p>}
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-[8px] bg-surface-sunken p-3">
          <dt className="text-[11px] font-semibold text-ink-400 flex items-center gap-1">
            <BookOpen className="w-3 h-3" /> Lições
          </dt>
          <dd className="font-display font-bold text-[18px] text-ink-900">
            {profile.lessonsCompleted}/{profile.totalLessons}
          </dd>
        </div>
        <div className="rounded-[8px] bg-surface-sunken p-3">
          <dt className="text-[11px] font-semibold text-ink-400">Membro desde</dt>
          <dd className="font-semibold text-[13px] text-ink-900 mt-1">{formatMemberSince(profile.memberSince)}</dd>
        </div>
      </dl>

      {archetype && (
        <Badge tone="accent" className="mt-3">
          <Sparkles className="w-3 h-3" />
          {archetype.name}
        </Badge>
      )}
    </Card>
  )
}

function ProgressBar({
  value,
  barClassName,
  label,
  className,
}: {
  value: number
  barClassName: string
  label: string
  className?: string
}) {
  return (
    <div
      className={cn('h-2 w-full rounded-full bg-surface-sunken overflow-hidden', className)}
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={cn('h-full rounded-full', barClassName)} style={{ width: `${value}%` }} />
    </div>
  )
}
