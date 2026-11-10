'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { cn } from '@/services/utils'
import type { Skill } from './types'
import { chipColor } from './ui'

export function SkillMultiSelect({
  skills,
  value,
  onChange,
  labelledBy,
}: {
  skills: Skill[]
  value: number[]
  onChange: (ids: number[]) => void
  labelledBy: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const listId = useId()

  const selected = value.map((id) => skills.find((s) => s.id === id)).filter((s): s is Skill => !!s)
  const filtered = useMemo(
    () => skills.filter((s) => s.name.toLowerCase().includes(query.trim().toLowerCase())),
    [skills, query],
  )

  useEffect(() => {
    if (!open) return
    searchRef.current?.focus()
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [open])

  const toggle = (id: number) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])

  return (
    <div ref={rootRef} className="relative">
      <div
        className={cn(
          'flex min-h-11 flex-wrap items-center gap-1.5 rounded-md border border-input bg-card p-1.5 transition-colors',
          open && 'border-ring ring-3 ring-ring/20',
        )}
      >
        {selected.map((skill) => (
          <span
            key={skill.id}
            className={cn('inline-flex h-7 items-center gap-1 rounded-full border pl-2.5 pr-1 text-xs font-medium', chipColor(skill.name))}
          >
            {skill.name}
            <button
              type="button"
              onClick={() => toggle(skill.id)}
              aria-label={`Remove ${skill.name} from project`}
              className="inline-flex size-5 items-center justify-center rounded-full opacity-60 hover:bg-black/5 hover:opacity-100"
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          </span>
        ))}
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby={labelledBy}
          onClick={() => setOpen((o) => !o)}
          className="ml-auto inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {selected.length ? 'Edit' : 'Select skills'}
          <ChevronDown className={cn('size-3.5 transition-transform', open && 'rotate-180')} aria-hidden="true" />
        </button>
      </div>

      {open && (
        <div className="absolute inset-x-0 top-full z-30 mt-1.5 overflow-hidden rounded-lg border bg-popover shadow-lg animate-in fade-in-0 zoom-in-95">
          <div className="flex items-center gap-2 border-b px-3">
            <Search className="size-4 text-muted-foreground" aria-hidden="true" />
            <input
              ref={searchRef}
              value={query}
              role="combobox"
              aria-controls={listId}
              aria-expanded="true"
              aria-activedescendant={filtered[activeIndex] ? `${listId}-${filtered[activeIndex].id}` : undefined}
              aria-label="Search your skills"
              placeholder="Search your skills…"
              onChange={(e) => {
                setQuery(e.target.value)
                setActiveIndex(0)
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  setActiveIndex((i) => Math.max(i - 1, 0))
                } else if (e.key === 'Enter') {
                  if (e.nativeEvent.isComposing || e.keyCode === 229) return
                  e.preventDefault()
                  e.stopPropagation()
                  const skill = filtered[activeIndex]
                  if (skill) toggle(skill.id)
                } else if (e.key === 'Escape') {
                  e.stopPropagation()
                  setOpen(false)
                }
              }}
              className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
            />
          </div>
          <ul id={listId} role="listbox" aria-multiselectable="true" className="max-h-56 overflow-y-auto p-1">
            {filtered.length === 0 && (
              <li className="px-3 py-4 text-center text-sm text-muted-foreground">
                No matching skills. Add new skills in the Skills section.
              </li>
            )}
            {filtered.map((skill, i) => {
              const isSelected = value.includes(skill.id)
              return (
                <li
                  key={skill.id}
                  id={`${listId}-${skill.id}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => toggle(skill.id)}
                  className={cn(
                    'flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm',
                    i === activeIndex && 'bg-muted',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-4 items-center justify-center rounded border',
                      isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-card',
                    )}
                    aria-hidden="true"
                  >
                    {isSelected && <Check className="size-3" />}
                  </span>
                  <span className="flex-1">{skill.name}</span>
                  {skill.proficiency && <span className="text-xs text-muted-foreground">{skill.proficiency}</span>}
                </li>
              )
            })}
          </ul>
          <div className="flex items-center justify-between border-t bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            <span>{value.length} selected</span>
            <button type="button" onClick={() => setOpen(false)} className="font-medium text-primary hover:underline">
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
