'use client'

import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Check, Loader2, Plus, Sparkles, X } from 'lucide-react'
import { cn } from '@/services/utils'
import { ErrorBanner } from '../entry-editor'
import { SectionCard } from '../section-card'
import { SKILL_PROFICIENCIES, type Skill } from '../types'
import { addButtonClassName, Button, TextInput, chipColor, newTempId } from '../ui'

type SyncStatus = 'idle' | 'saving' | 'saved'

export function LevelBars({ proficiency, className }: { proficiency: string | null; className?: string }) {
  const filled = proficiency ? (SKILL_PROFICIENCIES as readonly string[]).indexOf(proficiency) + 1 : 0
  return (
    <span className={cn('inline-flex items-end gap-0.5', className)} aria-hidden="true">
      {SKILL_PROFICIENCIES.map((_, i) => (
        <span
          key={i}
          className={cn('w-0.75 rounded-full', i < filled ? 'bg-current' : 'bg-current/20')}
          style={{ height: `${5 + i * 2}px` }}
        />
      ))}
    </span>
  )
}

export function SkillsSection({
  profileId,
  skills,
  onChange,
  onSave,
  onDelete,
  usage,
}: {
  profileId: number
  skills: Skill[]
  onChange: (skills: Skill[]) => void
  onSave: (skill: Skill) => Promise<Skill>
  onDelete: (skill: Skill) => Promise<void>
  usage: Record<number, number>
}) {
  const [name, setName] = useState('')
  const [inputError, setInputError] = useState<string | null>(null)
  const [openId, setOpenId] = useState<number | null>(null)
  const [sync, setSync] = useState<SyncStatus>('idle')
  const [syncError, setSyncError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const commit = async (next: Skill[], changedSkill: Skill) => {
    const previous = skills
    onChange(next)
    setSync('saving')
    setSyncError(null)
    try {
      const savedSkill = await onSave(changedSkill)
      onChange(next.map((skill) => (skill.id === changedSkill.id ? savedSkill : skill)))
      setSync('saved')
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setSync('idle'), 2000)
    } catch (error) {
      onChange(previous)
      setSync('idle')
      setSyncError(error instanceof Error ? error.message : 'Your last skill change could not be saved. Please try again.')
    }
  }

  const removeSkill = async (skill: Skill) => {
    setDeletingId(skill.id)
    setSync('saving')
    setSyncError(null)
    try {
      await onDelete(skill)
      onChange(skills.filter((item) => item.id !== skill.id))
      setOpenId(null)
      setSync('saved')
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setSync('idle'), 2000)
    } catch (error) {
      setSync('idle')
      setSyncError(error instanceof Error ? error.message : 'Could not remove this skill. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const addSkill = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    if (skills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      setInputError(`"${trimmed}" is already in your skills.`)
      return
    }
    const newSkill = { id: newTempId(), profile_id: profileId, name: trimmed, proficiency: null }
    commit([...skills, newSkill], newSkill)
    setName('')
    setInputError(null)
  }

  return (
    <SectionCard
      id="skills"
      icon={Sparkles}
      title="Skills"
      description="Click a skill to set your proficiency. Changes save automatically."
      meta={
        <>
          {sync === 'saving' && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" role="status">
              <Loader2 className="size-3 animate-spin" aria-hidden="true" /> Saving
            </span>
          )}
          {sync === 'saved' && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-700" role="status">
              <Check className="size-3" aria-hidden="true" /> Saved
            </span>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <form onSubmit={addSkill} className="flex flex-col gap-1.5">
          <label htmlFor="new-skill" className="sr-only">
            Add a skill
          </label>
          <div className="flex gap-2">
            <TextInput
              id="new-skill"
              value={name}
              placeholder="Add a skill, e.g. GraphQL"
              aria-invalid={!!inputError}
              aria-describedby={inputError ? 'new-skill-error' : undefined}
              onChange={(e) => {
                setName(e.target.value)
                setInputError(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.nativeEvent.isComposing || e.keyCode === 229)) e.preventDefault()
              }}
            />
            <Button type="submit" variant="subtle" className={addButtonClassName} disabled={!name.trim()}>
              <Plus className="size-4" aria-hidden="true" />
              Add
            </Button>
          </div>
          {inputError && (
            <p id="new-skill-error" className="text-xs text-destructive">
              {inputError}
            </p>
          )}
        </form>

        {syncError && <ErrorBanner message={syncError} />}

        {skills.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Your skills">
            {skills.map((skill) => (
              <SkillChip
                key={skill.id}
                skill={skill}
                usage={usage[skill.id] ?? 0}
                isDeleting={deletingId === skill.id}
                open={openId === skill.id}
                onOpenChange={(open) => setOpenId(open ? skill.id : null)}
                onProficiencyChange={(proficiency) => {
                  const updatedSkill = { ...skill, proficiency }
                  commit(skills.map((s) => (s.id === skill.id ? updatedSkill : s)), updatedSkill)
                }}
                onRemove={() => removeSkill(skill)}
              />
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="font-medium">Proficiency:</span>
          {SKILL_PROFICIENCIES.map((level) => (
            <span key={level} className="inline-flex items-center gap-1.5">
              <LevelBars proficiency={level} className="text-primary/70" />
              {level}
            </span>
          ))}
        </div>
      </div>
    </SectionCard>
  )
}

function SkillChip({
  skill,
  usage,
  isDeleting,
  open,
  onOpenChange,
  onProficiencyChange,
  onRemove,
}: {
  skill: Skill
  usage: number
  isDeleting: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onProficiencyChange: (proficiency: string | null) => void
  onRemove: () => void
}) {
  const ref = useRef<HTMLLIElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) onOpenChange(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onOpenChange(false)
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onOpenChange])

  const color = chipColor(skill.name)

  return (
    <li ref={ref} className="relative">
      <div className={cn('inline-flex h-8 items-center rounded-full border text-sm font-medium transition-shadow', color, open && 'ring-2 ring-primary/30')}>
        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={() => onOpenChange(!open)}
          className="inline-flex h-full items-center gap-2 rounded-l-full pl-3 pr-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {skill.name}
          <LevelBars proficiency={skill.proficiency} className="opacity-80" />
          <span className="sr-only">
            {skill.proficiency ? `, ${skill.proficiency}` : ', no proficiency set'}. Edit proficiency
          </span>
        </button>
        <button
          type="button"
          onClick={onRemove}
          disabled={isDeleting}
          aria-label={`Remove ${skill.name}`}
          className="mr-1 inline-flex size-6 items-center justify-center rounded-full opacity-60 transition hover:bg-black/5 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-40"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      </div>

      {open && (
        <div
          role="dialog"
          aria-label={`${skill.name} proficiency`}
          className="absolute left-0 top-full z-20 mt-2 w-56 rounded-lg border bg-popover p-1.5 shadow-lg animate-in fade-in-0 zoom-in-95"
        >
          <p className="px-2 pb-1 pt-1 text-xs font-semibold text-muted-foreground">Proficiency</p>
          <div role="radiogroup" aria-label="Proficiency level" className="flex flex-col">
            {[...SKILL_PROFICIENCIES, null].map((level) => {
              const selected = skill.proficiency === level
              return (
                <button
                  key={level ?? 'none'}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => {
                    onProficiencyChange(level)
                    onOpenChange(false)
                  }}
                  className={cn(
                    'flex items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted',
                    selected && 'bg-secondary font-medium text-primary',
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    <LevelBars proficiency={level} className="text-primary/70" />
                    {level ?? 'Not specified'}
                  </span>
                  {selected && <Check className="size-3.5" aria-hidden="true" />}
                </button>
              )
            })}
          </div>
          {usage > 0 && (
            <p className="mt-1 border-t px-2 pt-2 pb-1 text-xs text-muted-foreground">
              Used in {usage} project{usage > 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}
    </li>
  )
}
