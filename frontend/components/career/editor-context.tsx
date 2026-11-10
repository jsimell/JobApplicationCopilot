'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from './ui'

interface PendingSwitch {
  nextId: string | null
  onConfirm?: () => void
  onCancel?: () => void
}

interface EditorContextValue {
  activeId: string | null
  /** Open an editor. If another editor has unsaved changes, the user is asked first. */
  requestEdit: (id: string, opts?: { onCancel?: () => void }) => void
  /** Run an action that leaves the current editor, confirming first if it has unsaved changes. */
  guardNavigation: (action: () => void) => void
  finishEdit: (id: string) => void
  setDirty: (id: string, dirty: boolean) => void
  hasUnsavedChanges: boolean
  simulateFailure: boolean
  setSimulateFailure: (value: boolean) => void
}

const EditorContext = createContext<EditorContextValue | null>(null)

export function useEditor() {
  const ctx = useContext(EditorContext)
  if (!ctx) throw new Error('useEditor must be used within EditorProvider')
  return ctx
}

export function EditorProvider({ children }: { children: ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(() => new Set())
  const [pending, setPending] = useState<PendingSwitch | null>(null)
  const [simulateFailure, setSimulateFailure] = useState(false)
  const keepEditingRef = useRef<HTMLButtonElement>(null)

  const activeIsDirty = activeId !== null && dirtyIds.has(activeId)

  const setDirty = useCallback((id: string, dirty: boolean) => {
    setDirtyIds((prev) => {
      if (prev.has(id) === dirty) return prev
      const next = new Set(prev)
      if (dirty) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  const requestEdit = useCallback(
    (id: string, opts?: { onCancel?: () => void }) => {
      if (activeId === id) return
      if (activeIsDirty) {
        setPending({ nextId: id, onCancel: opts?.onCancel })
        return
      }
      setActiveId(id)
    },
    [activeId, activeIsDirty],
  )

  const guardNavigation = useCallback(
    (action: () => void) => {
      if (activeIsDirty) {
        setPending({ nextId: null, onConfirm: action })
        return
      }
      action()
    },
    [activeIsDirty],
  )

  const finishEdit = useCallback((id: string) => {
    setActiveId((current) => (current === id ? null : current))
    setDirty(id, false)
  }, [setDirty])

  const discardAndContinue = () => {
    if (!pending) return
    if (activeId) setDirty(activeId, false)
    setActiveId(pending.nextId)
    pending.onConfirm?.()
    setPending(null)
  }

  const keepEditing = () => {
    pending?.onCancel?.()
    setPending(null)
    const el = activeId ? document.getElementById(`editor-${activeId}`) : null
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  useEffect(() => {
    if (pending) keepEditingRef.current?.focus()
  }, [pending])

  useEffect(() => {
    if (dirtyIds.size === 0) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirtyIds.size])

  const value = useMemo<EditorContextValue>(
    () => ({
      activeId,
      requestEdit,
      guardNavigation,
      finishEdit,
      setDirty,
      hasUnsavedChanges: dirtyIds.size > 0,
      simulateFailure,
      setSimulateFailure,
    }),
    [activeId, requestEdit, guardNavigation, finishEdit, setDirty, dirtyIds.size, simulateFailure],
  )

  return (
    <EditorContext.Provider value={value}>
      {children}
      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/25 p-4 animate-in fade-in-0">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="discard-title"
            aria-describedby="discard-desc"
            onKeyDown={(e) => e.key === 'Escape' && keepEditing()}
            className="w-full max-w-sm rounded-xl border bg-card p-5 shadow-xl animate-in zoom-in-95"
          >
            <div className="flex gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700">
                <AlertTriangle className="size-4" aria-hidden="true" />
              </div>
              <div>
                <h2 id="discard-title" className="text-sm font-semibold text-foreground">
                  Discard unsaved changes?
                </h2>
                <p id="discard-desc" className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  You have unsaved edits in another entry. If you continue, those changes will be lost.
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button ref={keepEditingRef} size="sm" variant="secondary" onClick={keepEditing}>
                Keep editing
              </Button>
              <Button size="sm" variant="danger" onClick={discardAndContinue}>
                Discard changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </EditorContext.Provider>
  )
}

/** Simulated network save. Replace with a call to the FastAPI backend. */
export function simulateSave(fail: boolean) {
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => (fail ? reject(new Error('The server could not be reached. Your changes are still here — try again.')) : resolve()), 900)
  })
}
