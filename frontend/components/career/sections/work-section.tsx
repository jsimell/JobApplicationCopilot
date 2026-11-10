'use client'

import { Briefcase } from 'lucide-react'
import { EntryList } from '../entry-editor'
import { SectionCard } from '../section-card'
import type { WorkExperience } from '../types'
import { Checkbox, Field, MonthYearInput, TextArea, TextInput, formatDuration, formatRange, newTempId, orNull } from '../ui'

export function WorkSection({
  profileId,
  items,
  onChange,
  onSave,
}: {
  profileId: number
  items: WorkExperience[]
  onChange: (v: WorkExperience[]) => void
  onSave: (work: WorkExperience) => Promise<WorkExperience>
}) {
  return (
    <SectionCard
      id="work_experiences"
      icon={Briefcase}
      title="Work Experience"
      description="Roles you have held, most recent first."
    >
      <EntryList
        sectionKey="work_experiences"
        items={items}
        onChange={onChange}
        onSaveEntry={onSave}
        noun="experience"
        createEmpty={() => ({
          id: newTempId(),
          profile_id: profileId,
          title: '',
          company: '',
          location: null,
          start_date: null,
          end_date: null,
          description: null,
        })}
        validate={(v) => {
          if (!v.title.trim() || !v.company.trim()) return 'Please add a job title and company.'
          if (v.start_date && v.end_date && v.end_date < v.start_date) return 'The end date cannot be before the start date.'
          return null
        }}
        renderSummary={(w) => <WorkSummary item={w} />}
        renderForm={(d, update) => <WorkForm draft={d} update={update} />}
      />
    </SectionCard>
  )
}

function WorkSummary({ item: w }: { item: WorkExperience }) {
  const ongoing = !w.end_date
  return (
    <div className="flex gap-3">
      <div
        className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground"
        aria-hidden="true"
      >
        {w.company.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="font-medium text-foreground">{w.title}</p>
          {ongoing && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200">
              Current
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{[w.company, w.location].filter(Boolean).join(' · ')}</p>
        <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
          {formatRange(w.start_date, w.end_date)}
          {w.start_date && <span className="text-muted-foreground/70"> · {formatDuration(w.start_date, w.end_date)}</span>}
        </p>
        {w.description && (
          <p className="mt-2 line-clamp-2 whitespace-pre-line text-sm leading-relaxed text-foreground/75">{w.description}</p>
        )}
      </div>
    </div>
  )
}

function WorkForm({ draft: d, update }: { draft: WorkExperience; update: (p: Partial<WorkExperience>) => void }) {
  const ongoing = !d.end_date
  const fid = (field: string) => `work-${d.id}-${field}`
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Job title" htmlFor={fid('title')} required>
        <TextInput id={fid('title')} aria-required="true" value={d.title} onChange={(e) => update({ title: e.target.value })} />
      </Field>
      <Field label="Company" htmlFor={fid('company')} required>
        <TextInput id={fid('company')} aria-required="true" value={d.company} onChange={(e) => update({ company: e.target.value })} />
      </Field>
      <Field label="Location" htmlFor={fid('location')} className="sm:col-span-2">
        <TextInput
          id={fid('location')}
          value={d.location ?? ''}
          placeholder="e.g. Berlin, Germany · Remote"
          onChange={(e) => update({ location: orNull(e.target.value) })}
        />
      </Field>
      <Field label="Start date" htmlFor={fid('start_date')}>
        <MonthYearInput
          id={fid('start_date')}
          ariaLabel="Start date"
          value={d.start_date}
          onChange={(start_date) => update({ start_date })}
        />
      </Field>
      <Field label="End date" htmlFor={fid('end_date')} hint={ongoing ? 'Leave empty if you still work here.' : undefined}>
        <MonthYearInput id={fid('end_date')} ariaLabel="End date" value={d.end_date} onChange={(end_date) => update({ end_date })} />
        {!ongoing && <Checkbox label="I currently work here" checked={false} onChange={(v) => v && update({ end_date: null })} />}
      </Field>
      <Field
        label="Description"
        htmlFor={fid('description')}
        className="sm:col-span-2"
        hint="Responsibilities and measurable achievements."
      >
        <TextArea
          id={fid('description')}
          rows={6}
          value={d.description ?? ''}
          onChange={(e) => update({ description: orNull(e.target.value) })}
        />
      </Field>
    </div>
  )
}
