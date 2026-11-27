import type { ReactNode } from 'react'

export function SectionCardHeader({
  titleId,
  icon,
  title,
  description,
  meta,
}: {
  titleId: string
  icon: ReactNode
  title: string
  description: string
  meta?: ReactNode
}) {
  return (
    <header className="flex items-center justify-between gap-4 border-b px-5 py-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
          {icon}
        </div>
        <div className="min-w-0">
          <h2 id={titleId} className="text-base font-semibold tracking-tight text-primary">
            {title}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {meta && <div className="flex shrink-0 items-center gap-2">{meta}</div>}
    </header>
  )
}
