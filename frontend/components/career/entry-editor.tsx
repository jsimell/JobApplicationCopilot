'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { AlertCircle, Pencil, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/services/utils'
import { useEditor } from './editor-context'
import { addButtonClassName, Button } from './ui'

type SaveStatus = 'idle' | 'saving' | 'error'

export function useEntryEditor<T>({
  id,
  saved,
  onSave,
  isNew = false,
  onDiscardNew,
  validate,
}: {
  id: string
  saved: T
  onSave: (value: T) => void | Promise<void>
  isNew?: boolean
  onDiscardNew?: () => void
  validate?: (value: T) => string | null
}) {
  const { activeId, requestEdit, finishEdit, setDirty } = useEditor()
  const isEditing = activeId === id
  const [draft, setDraft] = useState<T>(saved)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const wasEditing = useRef(false)
  const lifecycleRef = useRef(0)

  useEffect(() => {
    if (isEditing && !wasEditing.current) {
      setDraft(saved)
      setStatus('idle')
      setError(null)
    }
    if (!isEditing && wasEditing.current && isNew) onDiscardNew?.()
    wasEditing.current = isEditing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing])

  const isDirty = isEditing && JSON.stringify(draft) !== JSON.stringify(saved)

  useEffect(() => {
    setDirty(id, isDirty)
  }, [id, isDirty, setDirty])

  useEffect(() => {
    const lifecycle = ++lifecycleRef.current
    return () => {
      queueMicrotask(() => {
        if (lifecycleRef.current === lifecycle) finishEdit(id)
      })
    }
  }, [id, finishEdit])

  const update = useCallback((patch: Partial<T>) => {
    setDraft((d) => ({ ...d, ...patch }))
    setStatus((s) => (s === 'error' ? 'idle' : s))
  }, [])

  const startEdit = (opts?: { onCancel?: () => void }) => {
    setDraft(saved)
    requestEdit(id, opts)
  }

  const cancel = () => finishEdit(id)

  const save = async () => {
    const message = validate?.(draft)
    if (message) {
      setStatus('error')
      setError(message)
      return
    }
    setStatus('saving')
    setError(null)
    try {
      await onSave(draft)
      setStatus('idle')
      finishEdit(id)
    } catch (e) {
      setStatus('error')
      setError(e instanceof Error ? e.message : 'Something went wrong while saving.')
    }
  }

  return { isEditing, draft, update, startEdit, cancel, save, status, error, isDirty }
}

/* ---------- Shared edit-mode chrome ---------- */

export function UnsavedBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
      <span className="size-1.5 rounded-full bg-amber-500" aria-hidden="true" />
      Unsaved changes
    </span>
  )
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p className="flex-1 leading-relaxed">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="shrink-0 font-medium underline underline-offset-2">
          Retry
        </button>
      )}
    </div>
  )
}

export function EditFooter({
  status,
  error,
  isDirty,
  isNew,
  onSave,
  onCancel,
  leading,
}: {
  status: SaveStatus
  error: string | null
  isDirty: boolean
  isNew?: boolean
  onSave: () => void
  onCancel: () => void
  leading?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 border-t bg-muted/50 px-4 py-3">
      {status === 'error' && error && <ErrorBanner message={error} onRetry={onSave} />}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {leading}
          <span className="text-xs text-muted-foreground">
            <span className="text-destructive" aria-hidden="true">
              *
            </span>{' '}
            Required
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {status === 'saving' ? 'Saving…' : isDirty ? '⌘ + Enter to save' : ''}
          </span>
          <Button size="sm" variant="ghost" onClick={onCancel} disabled={status === 'saving'}>
            Cancel
          </Button>
          <Button size="sm" variant="primary" onClick={onSave} loading={status === 'saving'} disabled={!isDirty && !isNew}>
            {status === 'saving' ? 'Saving' : isNew ? 'Add' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function saveShortcut(onSave: () => void) {
  return (e: KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      onSave()
    }
  }
}

function DeleteControl({ noun, onDelete, compact }: { noun: string; onDelete: () => void; compact?: boolean }) {
  return compact ? (
    <Button size="icon" variant="ghost" aria-label={`Delete ${noun}`} onClick={onDelete} className="hover:text-destructive">
      <Trash2 className="size-4" aria-hidden="true" />
    </Button>
  ) : (
    <Button size="sm" variant="ghost" aria-label={`Delete ${noun}`} onClick={onDelete} className="hover:text-destructive">
      <Trash2 className="size-4" aria-hidden="true" />
      Delete
    </Button>
  )
}

/* ---------- Entry card ---------- */

interface EntryCardProps<T> {
  editorId: string
  item: T
  noun: string
  isNew?: boolean
  renderSummary: (item: T) => ReactNode
  renderForm: (draft: T, update: (patch: Partial<T>) => void) => ReactNode
  validate?: (value: T) => string | null
  onSave: (value: T) => void | Promise<void>
  onDelete?: () => void
  onDiscardNew?: () => void
  autoStart?: boolean
}

export function EntryCard<T>({
  editorId,
  item,
  noun,
  isNew,
  renderSummary,
  renderForm,
  validate,
  onSave,
  onDelete,
  onDiscardNew,
}: EntryCardProps<T>) {
  const editor = useEntryEditor({ id: editorId, saved: item, onSave, isNew, onDiscardNew, validate })
  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!editor.isEditing) return
    const el = formRef.current
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    el?.querySelector<HTMLElement>('input, textarea, select')?.focus({ preventScroll: true })
  }, [editor.isEditing])

  if (!editor.isEditing) {
    if (isNew) return null
    return (
      <div
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('a, button')) return
          editor.startEdit()
        }}
        className="group relative flex cursor-pointer items-start gap-3 rounded-lg border bg-card px-4 py-3.5 transition-colors hover:border-primary/25 hover:bg-secondary/30"
      >
        <div className="min-w-0 flex-1">{renderSummary(item)}</div>
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-0.5 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
            <Button size="icon" variant="ghost" aria-label={`Edit ${noun}`} onClick={() => editor.startEdit()}>
              <Pencil className="size-4" aria-hidden="true" />
            </Button>
            {onDelete && <DeleteControl noun={noun} onDelete={onDelete} compact />}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      id={`editor-${editorId}`}
      ref={formRef}
      onKeyDown={saveShortcut(editor.save)}
      className="col-span-full scroll-mt-24 overflow-hidden rounded-lg border border-primary/35 bg-card shadow-sm ring-4 ring-primary/5"
    >
      <div className="flex items-center justify-between gap-2 border-b bg-secondary/40 px-4 py-2.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          {isNew ? `New ${noun}` : `Editing ${noun}`}
        </p>
        {editor.isDirty && <UnsavedBadge />}
      </div>
      <fieldset disabled={editor.status === 'saving'} className="p-4">
        <legend className="sr-only">{isNew ? `New ${noun}` : `Edit ${noun}`}</legend>
        {renderForm(editor.draft, editor.update)}
      </fieldset>
      <EditFooter
        status={editor.status}
        error={editor.error}
        isDirty={editor.isDirty}
        isNew={isNew}
        onSave={editor.save}
        onCancel={editor.cancel}
        leading={!isNew && onDelete ? <DeleteControl noun={noun} onDelete={onDelete} /> : null}
      />
    </div>
  )
}

/* ---------- Entry list ---------- */

interface EntryListProps<T extends { id: number }> {
  sectionKey: string
  items: T[]
  onChange: (items: T[]) => void
  onSaveEntry?: (item: T) => Promise<T>
  onDeleteEntry?: (item: T) => Promise<void>
  createEmpty: () => T
  noun: string
  renderSummary: (item: T) => ReactNode
  renderForm: (draft: T, update: (patch: Partial<T>) => void) => ReactNode
  validate?: (value: T) => string | null
  layout?: 'stack' | 'grid'
}

export function EntryList<T extends { id: number }>({
  sectionKey,
  items,
  onChange,
  onSaveEntry,
  onDeleteEntry,
  createEmpty,
  noun,
  renderSummary,
  renderForm,
  validate,
  layout = 'stack',
}: EntryListProps<T>) {
  const { requestEdit } = useEditor()
  const [pendingNew, setPendingNew] = useState<T | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const addNew = () => {
    if (pendingNew) return
    const fresh = createEmpty()
    setPendingNew(fresh)
    requestEdit(`${sectionKey}:${fresh.id}`, { onCancel: () => setPendingNew(null) })
  }

  const saveEntry = async (value: T, existingId?: number) => {
    const savedItem = onSaveEntry ? await onSaveEntry(value) : value

    onChange(
      existingId === undefined
        ? [...items, savedItem]
        : items.map((item) => (item.id === existingId ? savedItem : item)),
    )

  }

  const deleteEntry = async (item: T) => {
    setDeleteError(null)
    try {
      await onDeleteEntry?.(item)
      onChange(items.filter((current) => current.id !== item.id))
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : `Could not delete this ${noun}. Please try again.`)
    }
  }

  const shared = { noun, renderSummary, renderForm, validate }

  return (
    <div className="flex flex-col gap-3">
      {deleteError && <ErrorBanner message={deleteError} />}
      <div className={cn(layout === 'grid' ? 'grid gap-3 sm:grid-cols-2' : 'flex flex-col gap-3')}>
        {items.map((item) => (
          <EntryCard
            key={item.id}
            editorId={`${sectionKey}:${item.id}`}
            item={item}
            onSave={(value) => saveEntry(value, item.id)}
            onDelete={() => deleteEntry(item)}
            {...shared}
          />
        ))}
        {pendingNew && (
          <EntryCard
            key={`new-${pendingNew.id}`}
            editorId={`${sectionKey}:${pendingNew.id}`}
            item={pendingNew}
            isNew
            onSave={(value) => saveEntry(value)}
            onDiscardNew={() => setPendingNew(null)}
            {...shared}
          />
        )}
      </div>
      {!pendingNew && (
        <Button
          variant='primary'
          onClick={addNew}
          className={cn(addButtonClassName, 'w-full')}
        >
          <Plus className="size-4" aria-hidden="true" />
          Add {noun}
        </Button>
      )}
    </div>
  )
}
