import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { SectionCardHeader } from '../shared/section-card-header'

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
      className="scroll-mt-20 rounded-xl border bg-card shadow-sm"
    >
      <SectionCardHeader
        titleId={`section-${id}-title`}
        icon={<Icon className="size-4.5" aria-hidden="true" />}
        title={title}
        description={description}
        meta={meta}
      />
      <div className="px-5 py-5 sm:px-6">{children}</div>
    </section>
  )
}
