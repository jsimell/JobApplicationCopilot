'use client'

import { GraduationCap } from 'lucide-react'
import { EntryList } from '../entry-editor'
import { SectionCard } from '../section-card'
import type { Degree } from '../types'
import { DecimalInput, Field, MonthYearInput, TextArea, TextInput, formatMonth, newTempId, orNull } from '../ui'

export function DegreesSection({
  profileId,
  items,
  onChange,
  onSave,
  onDelete,
}: {
  profileId: number
  items: Degree[]
  onChange: (v: Degree[]) => void
  onSave: (degree: Degree) => Promise<Degree>
  onDelete: (degreeId: number) => Promise<void>
}) {
  return (
    <SectionCard
      id="degrees"
      icon={GraduationCap}
      title="Education"
      description="Degrees, diplomas, and academic programs."
    >
      <EntryList
        sectionKey="degrees"
        items={items}
        onChange={onChange}
        onSaveEntry={onSave}
        onDeleteEntry={(degree) => onDelete(degree.id)}
        noun="degree"
        createEmpty={() => ({
          id: newTempId(),
          profile_id: profileId,
          title: '',
          school: '',
          location: null,
          finished_date: null,
          gpa: null,
          major: null,
          minor: null,
          additional_information: null,
        })}
        validate={(v) => {
          if (!v.title.trim() || !v.school.trim()) return 'Please add a degree title and school.'
          if (v.gpa !== null && (Number.isNaN(v.gpa) || v.gpa < 0)) return 'GPA must be a positive number, e.g. 3.7'
          return null
        }}
        renderSummary={(deg) => (
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <p className="font-medium text-foreground">{deg.title}</p>
              {deg.finished_date && (
                <p className="text-xs tabular-nums text-muted-foreground">{formatMonth(deg.finished_date)}</p>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{[deg.school, deg.location].filter(Boolean).join(' · ')}</p>
            {(deg.major || deg.minor || deg.gpa !== null) && (
              <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                {deg.major && <Meta label="Major" value={deg.major} />}
                {deg.minor && <Meta label="Minor" value={deg.minor} />}
                {deg.gpa !== null && <Meta label="GPA" value={String(deg.gpa)} />}
              </div>
            )}
            {deg.additional_information && (
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-foreground/75">{deg.additional_information}</p>
            )}
          </div>
        )}
        renderForm={(d, update) => {
          const fid = (field: string) => `degree-${d.id}-${field}`
          return (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Degree title" htmlFor={fid('title')} required>
                <TextInput
                  id={fid('title')}
                  aria-required="true"
                  value={d.title}
                  placeholder="e.g. M.Sc. Computer Science"
                  onChange={(e) => update({ title: e.target.value })}
                />
              </Field>
              <Field label="School" htmlFor={fid('school')} required>
                <TextInput
                  id={fid('school')}
                  aria-required="true"
                  value={d.school}
                  onChange={(e) => update({ school: e.target.value })}
                />
              </Field>
              <Field label="Location" htmlFor={fid('location')}>
                <TextInput
                  id={fid('location')}
                  value={d.location ?? ''}
                  onChange={(e) => update({ location: orNull(e.target.value) })}
                />
              </Field>
              <Field label="Finished" htmlFor={fid('finished_date')}>
                <MonthYearInput
                  id={fid('finished_date')}
                  ariaLabel="Finished date"
                  value={d.finished_date}
                  onChange={(finished_date) => update({ finished_date })}
                />
              </Field>
              <Field label="Major" htmlFor={fid('major')}>
                <TextInput id={fid('major')} value={d.major ?? ''} onChange={(e) => update({ major: orNull(e.target.value) })} />
              </Field>
              <div className="grid grid-cols-[1fr_7rem] gap-4">
                <Field label="Minor" htmlFor={fid('minor')}>
                  <TextInput id={fid('minor')} value={d.minor ?? ''} onChange={(e) => update({ minor: orNull(e.target.value) })} />
                </Field>
                <Field label="GPA" htmlFor={fid('gpa')}>
                  <DecimalInput id={fid('gpa')} value={d.gpa} placeholder="e.g. 3.7" onChange={(gpa) => update({ gpa })} />
                </Field>
              </div>
              <Field label="Additional information" htmlFor={fid('additional_information')} className="sm:col-span-2">
                <TextArea
                  id={fid('additional_information')}
                  rows={3}
                  value={d.additional_information ?? ''}
                  placeholder="Thesis, honors, relevant coursework…"
                  onChange={(e) => update({ additional_information: orNull(e.target.value) })}
                />
              </Field>
            </div>
          )
        }}
      />
    </SectionCard>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-md bg-muted px-2 py-0.5 text-foreground/80">
      <span className="text-muted-foreground">{label}:</span> {value}
    </span>
  )
}
