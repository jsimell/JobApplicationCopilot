import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export function SectionCard({
  id,
  icon: Icon,
  title,
  description,
  meta,
  children,
}: {
  id: string
  icon: LucideIcon
  title: string
  description: string
  meta?: ReactNode
  children: ReactNode
}) {
  return (
    <section
      id={`section-${id}`}
      aria-labelledby={`section-${id}-title`}
      className="scroll-mt-20 rounded-xl border bg-background shadow-xs"
    >
      <header className="flex items-start justify-between gap-4 border-b px-5 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
            <Icon className="size-4.5" aria-hidden="true" />
          </div>
          <div>
            <h2 id={`section-${id}-title`} className="text-base font-semibold tracking-tight text-primary">
              {title}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        {meta && <div className="flex shrink-0 items-center gap-2 pt-1">{meta}</div>}
      </header>
      <div className="px-5 py-5 sm:px-6">{children}</div>
    </section>
  )
}
