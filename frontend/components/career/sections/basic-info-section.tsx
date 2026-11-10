'use client'

import { useEffect, useRef } from 'react'
import { MapPin, Pencil, Plus, Target, UserRound } from 'lucide-react'
import { EditFooter, UnsavedBadge, saveShortcut, useEntryEditor } from '../entry-editor'
import { SectionCard } from '../section-card'
import type { BasicDetails } from '../types'
import { addButtonClassName, Button, Field, TextArea, TextInput, orNull } from '../ui'

export function BasicInfoSection({ value, onChange }: { value: BasicDetails; onChange: (v: BasicDetails) => void }) {
  const editor = useEntryEditor({
    id: 'profile',
    saved: value,
    onSave: onChange,
    validate: (v) => {
      const missing = [!v.full_name.trim() && 'full name', !v.headline.trim() && 'headline'].filter(Boolean)
      return missing.length ? `Please enter your ${missing.join(' and ')}.` : null
    },
  })
  const formRef = useRef<HTMLDivElement>(null)

  const hasBasicInformation = [
    value.full_name,
    value.headline,
    value.location,
    value.summary,
    value.career_goals_description,
  ].some((field) => field?.trim())

  useEffect(() => {
    if (editor.isEditing) formRef.current?.querySelector('input')?.focus()
  }, [editor.isEditing])

  const { draft, update } = editor

  return (
    <SectionCard
      id="profile"
      icon={UserRound}
      title="Basic Information"
      description="How you introduce yourself to employers."
      meta={
        editor.isEditing ? (
          editor.isDirty && <UnsavedBadge />
        ) : hasBasicInformation ? (
          <Button size="sm" variant="subtle" onClick={() => editor.startEdit()}>
            <Pencil className="size-3.5" aria-hidden="true" />
            Edit
          </Button>
        ) : null
      }
    >
      {editor.isEditing ? (
        <div
          id="editor-profile"
          ref={formRef}
          onKeyDown={saveShortcut(editor.save)}
          className="-mx-5 -my-5 overflow-hidden rounded-b-xl sm:-mx-6"
        >
          <fieldset disabled={editor.status === 'saving'} className="grid gap-4 px-5 py-5 sm:grid-cols-2 sm:px-6">
            <legend className="sr-only">Edit basic information</legend>
            <Field label="Full name" htmlFor="profile-full_name" required>
              <TextInput
                id="profile-full_name"
                aria-required="true"
                value={draft.full_name}
                onChange={(e) => update({ full_name: e.target.value })}
              />
            </Field>
            <Field label="Location" htmlFor="profile-location">
              <TextInput
                id="profile-location"
                value={draft.location ?? ''}
                placeholder="City, Country"
                onChange={(e) => update({ location: orNull(e.target.value) })}
              />
            </Field>
            <Field label="Headline" htmlFor="profile-headline" className="sm:col-span-2" required>
              <TextInput
                id="profile-headline"
                aria-required="true"
                value={draft.headline}
                placeholder="e.g. Senior Product Designer · Fintech"
                onChange={(e) => update({ headline: e.target.value })}
              />
            </Field>
            <Field label="Summary" htmlFor="profile-summary" className="sm:col-span-2">
              <TextArea
                id="profile-summary"
                rows={4}
                value={draft.summary ?? ''}
                onChange={(e) => update({ summary: orNull(e.target.value) })}
              />
            </Field>
            <Field
              label="Career goals"
              htmlFor="profile-career_goals_description"
              hint="Used by the AI assistant to prioritize relevant opportunities. Not shown on your CV."
              className="sm:col-span-2"
            >
              <TextArea
                id="profile-career_goals_description"
                rows={6}
                value={draft.career_goals_description ?? ''}
                onChange={(e) => update({ career_goals_description: orNull(e.target.value) })}
              />
            </Field>
          </fieldset>
          <EditFooter
            status={editor.status}
            error={editor.error}
            isDirty={editor.isDirty}
            onSave={editor.save}
            onCancel={editor.cancel}
          />
        </div>
      ) : (
        hasBasicInformation ? (
          <div className="flex flex-col gap-5">
            <div>
              {value.full_name.trim() && (
                <p className="text-xl font-semibold tracking-tight text-foreground text-balance">{value.full_name}</p>
              )}
              {value.headline.trim() && (
                <p className="mt-1 text-sm font-medium text-primary/80 text-pretty">{value.headline}</p>
              )}
              {value.location?.trim() && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="size-3.5" aria-hidden="true" />
                  {value.location}
                </p>
              )}
            </div>
            {value.summary?.trim() && <p className="text-sm leading-relaxed text-foreground/85 text-pretty">{value.summary}</p>}
            {value.career_goals_description?.trim() && (
              <div className="rounded-lg bg-secondary/60 p-4">
                <p className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
                  <Target className="size-3.5" aria-hidden="true" />
                  Career goals
                </p>
                <p className="text-sm leading-relaxed text-foreground/80 text-pretty">{value.career_goals_description}</p>
              </div>
            )}
          </div>
        ) : (
          null
        )
      )}
      {!editor.isEditing && !hasBasicInformation && (
        <div className="mt-3">
          <Button
            variant="subtle"
            onClick={() => editor.startEdit()}
            className={`${addButtonClassName} w-full`}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add basic information
          </Button>
        </div>
      )}
    </SectionCard>
  )
}
