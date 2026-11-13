'use client'

import { Languages } from 'lucide-react'
import { EntryList } from '../entry-editor'
import { SectionCard } from '../section-card'
import { LANGUAGE_PROFICIENCIES, type Language } from '../types'
import { Field, Select, TextInput, newTempId } from '../ui'

export function LanguagesSection({
  profileId,
  items,
  onChange,
  onSave,
  onDelete,
}: {
  profileId: number
  items: Language[]
  onChange: (v: Language[]) => void
  onSave: (language: Language) => Promise<Language>
  onDelete: (languageId: number) => Promise<void>
}) {
  return (
    <SectionCard
      id="languages"
      icon={Languages}
      title="Languages"
      description="Languages you speak and how well."
    >
      <EntryList
        sectionKey="languages"
        layout="grid"
        items={items}
        onChange={onChange}
        onSaveEntry={onSave}
        onDeleteEntry={(language) => onDelete(language.id)}
        noun="language"
        createEmpty={() => ({ id: newTempId(), profile_id: profileId, language: '', proficiency: '' })}
        validate={(v) => (v.language.trim() && v.proficiency.trim() ? null : 'Please enter a language and select a proficiency.')}
        renderSummary={(l) => {
          const index = (LANGUAGE_PROFICIENCIES as readonly string[]).indexOf(l.proficiency)
          const pct = index >= 0 ? ((index + 1) / LANGUAGE_PROFICIENCIES.length) * 100 : 0
          return (
            <div>
              <p className="font-medium text-foreground">{l.language}</p>
              <p className="text-sm text-muted-foreground">{l.proficiency}</p>
              <div className="mt-2 h-1 w-full max-w-40 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                <div className="h-full rounded-full bg-primary/70" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        }}
        renderForm={(d, update) => {
          const fid = (field: string) => `language-${d.id}-${field}`
          return (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Language" htmlFor={fid('language')} required>
                <TextInput
                  id={fid('language')}
                  aria-required="true"
                  value={d.language}
                  onChange={(e) => update({ language: e.target.value })}
                />
              </Field>
              <Field label="Proficiency" htmlFor={fid('proficiency')} required>
                <Select
                  id={fid('proficiency')}
                  aria-required="true"
                  value={d.proficiency}
                  onChange={(e) => update({ proficiency: e.target.value })}
                >
                  <option value="">Select level</option>
                  {LANGUAGE_PROFICIENCIES.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          )
        }}
      />
    </SectionCard>
  )
}
