'use client'

import { Heart } from 'lucide-react'
import { EntryList } from '../entry-editor'
import { SectionCard } from '../section-card'
import type { Hobby } from '../types'
import { Field, TextArea, TextInput, newTempId, orNull } from '../ui'

export function HobbiesSection({
  profileId,
  items,
  onChange,
  onSave,
}: {
  profileId: number
  items: Hobby[]
  onChange: (v: Hobby[]) => void
  onSave: (hobby: Hobby) => Promise<Hobby>
}) {
  return (
    <SectionCard
      id="hobbies"
      icon={Heart}
      title="Hobbies"
      description="Interests that show who you are outside of work."
    >
      <EntryList
        sectionKey="hobbies"
        layout="grid"
        items={items}
        onChange={onChange}
        onSaveEntry={onSave}
        noun="hobby"
        createEmpty={() => ({ id: newTempId(), profile_id: profileId, name: '', description: null })}
        validate={(v) => (v.name.trim() ? null : 'Please enter a name for this hobby.')}
        renderSummary={(h) => (
          <div>
            <p className="font-medium text-foreground">{h.name}</p>
            {h.description ? (
              <p className="mt-0.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground" title={h.description}>
                {h.description}
              </p>
            ) : (
              <p className="mt-0.5 text-sm italic text-muted-foreground/70">No description</p>
            )}
          </div>
        )}
        renderForm={(d, update) => {
          const fid = (field: string) => `hobby-${d.id}-${field}`
          return (
            <div className="grid gap-4">
              <Field label="Name" htmlFor={fid('name')} required>
                <TextInput id={fid('name')} aria-required="true" value={d.name} onChange={(e) => update({ name: e.target.value })} />
              </Field>
              <Field label="Description" htmlFor={fid('description')}>
                <TextArea
                  id={fid('description')}
                  rows={3}
                  value={d.description ?? ''}
                  onChange={(e) => update({ description: orNull(e.target.value) })}
                />
              </Field>
            </div>
          )
        }}
      />
    </SectionCard>
  )
}
