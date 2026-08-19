// Shown while a Server Component awaits the API. Every data fetch is a network round trip
// to another service, so without this the browser sits on the previous screen with no
// feedback that anything is happening.
export default function Loading() {
  return (
    <div className="min-h-screen bg-surface-app flex flex-col items-center justify-center gap-4">
      <div
        className="w-10 h-10 rounded-full border-[3px] border-border-default border-t-accent animate-spin"
        role="status"
        aria-label="Carregando"
      />
      <p className="text-ink-500 text-[14px]">Carregando…</p>
    </div>
  )
}
