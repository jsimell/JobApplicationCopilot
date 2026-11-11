'use client'

import { useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { FileText, MessageSquareText, Send, Wand2 } from 'lucide-react'
import { cn } from '@/services/utils'

const TABS = [
  { id: 'tailor', label: 'Tailor Application', icon: Wand2 },
  { id: 'ask', label: 'Ask AI', icon: MessageSquareText },
] as const

type TabId = (typeof TABS)[number]['id']

export function AiAssistantPanel() {
  const [tab, setTab] = useState<TabId>('tailor')
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    const next = (index + (e.key === 'ArrowRight' ? 1 : -1) + TABS.length) % TABS.length
    setTab(TABS[next].id)
    tabRefs.current[next]?.focus()
  }

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-1">
        <div role="tablist" aria-label="AI Assistant tools" className="flex gap-1 rounded-lg bg-muted p-1">
          {TABS.map((t, i) => {
            const selected = tab === t.id
            return (
              <button
                key={t.id}
                ref={(el) => {
                  tabRefs.current[i] = el
                }}
                id={`ai-tab-${t.id}`}
                role="tab"
                type="button"
                aria-selected={selected}
                aria-controls={`ai-panel-${t.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setTab(t.id)}
                onKeyDown={(e) => onKeyDown(e, i)}
                className={cn(
                  'inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  selected ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <t.icon className="size-4" aria-hidden="true" />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      <div
        id={`ai-panel-${tab}`}
        role="tabpanel"
        aria-labelledby={`ai-tab-${tab}`}
        className="flex min-h-0 flex-1 flex-col p-5"
      >
        {tab === 'tailor' ? <TailorPlaceholder /> : <AskPlaceholder />}
      </div>
    </div>
  )
}

function TailorPlaceholder() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed bg-card/60 px-6 py-10 text-center">
        <div className="flex size-11 items-center justify-center rounded-full bg-secondary text-primary">
          <FileText className="size-5" aria-hidden="true" />
        </div>
        <p className="mt-4 text-sm font-semibold text-foreground">Tailor your application</p>
        <p className="mt-1 max-w-xs text-sm leading-relaxed text-muted-foreground text-pretty">
          Paste a job description and the assistant will highlight relevant experience and draft a tailored application based on your profile.
        </p>
        <span className="mt-4 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">Coming soon</span>
      </div>
    </div>
  )
}

function AskPlaceholder() {
  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="flex size-11 items-center justify-center rounded-full bg-secondary text-primary">
          <MessageSquareText className="size-5" aria-hidden="true" />
        </div>
        <p className="mt-4 text-sm font-semibold text-foreground">Ask about your profile</p>
        <p className="mt-1 max-w-xs text-sm leading-relaxed text-muted-foreground text-pretty">
          Get advice grounded in your profile — interview prep, skill gaps, or how to phrase an achievement.
        </p>
        <span className="mt-4 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">Coming soon</span>
      </div>
      <div className="flex items-center gap-2 rounded-xl border bg-card p-1.5 pl-3.5 opacity-60">
        <label htmlFor="ask-ai-input" className="sr-only">
          Message the AI assistant
        </label>
        <input
          id="ask-ai-input"
          disabled
          placeholder="Ask anything about your profile…"
          className="h-8 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          type="button"
          disabled
          aria-label="Send message"
          className="inline-flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
        >
          <Send className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
