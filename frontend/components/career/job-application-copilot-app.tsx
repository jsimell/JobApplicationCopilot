'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { Bot, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, UserRound } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/services/utils'
import appLogo from '@/assets/appLogo.png'
import { AiAssistantPanel } from './ai-assistant-panel'
import { EditorProvider, useEditor } from './editor-context'
import { ProfilePanel } from './profile-panel'

type PanelId = 'profile' | 'ai'

export function CareerProfileApp() {
  return (
    <EditorProvider>
      <AppShell />
    </EditorProvider>
  )
}

function AppShell() {
  const [collapsed, setCollapsed] = useState<PanelId | null>(null)
  const [mobilePanel, setMobilePanel] = useState<PanelId>('profile')

  const toggle = (panel: PanelId) => setCollapsed((c) => (c === panel ? null : panel))

  return (
    <div className="flex h-dvh flex-col">
      <TopBar />

      <div className="border-b bg-card px-4 py-2 lg:hidden">
        <div role="tablist" aria-label="Workspace" className="flex gap-1 rounded-lg bg-muted p-1">
          {(
            [
              { id: 'profile', label: 'Profile Editor', icon: UserRound },
              { id: 'ai', label: 'AI Assistant', icon: Bot },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={mobilePanel === t.id}
              onClick={() => setMobilePanel(t.id)}
              className={cn(
                'inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md text-sm font-medium',
                mobilePanel === t.id ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground',
              )}
            >
              <t.icon className="size-4" aria-hidden="true" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="flex min-h-0 flex-1 gap-3 p-0 lg:p-3">
        <Panel
          title="Profile Editor"
          icon={UserRound}
          side="left"
          collapsed={collapsed === 'profile'}
          onToggle={() => toggle('profile')}
          mobileHidden={mobilePanel !== 'profile'}
          className={collapsed === 'ai' ? 'lg:flex-1' : 'lg:flex-3'}
        >
          <ProfilePanel />
        </Panel>
        <Panel
          title="AI Assistant"
          icon={Bot}
          side="right"
          collapsed={collapsed === 'ai'}
          onToggle={() => toggle('ai')}
          mobileHidden={mobilePanel !== 'ai'}
          className={cn(collapsed === 'profile' ? 'lg:flex-1' : 'lg:flex-2', 'lg:bg-card')}
        >
          <AiAssistantPanel />
        </Panel>
      </main>
    </div>
  )
}

function TopBar() {
  const { hasUnsavedChanges } = useEditor()
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b bg-card px-4 sm:px-5">
      <div className="flex items-center gap-2.5">
        <Image src={appLogo} alt="" aria-hidden="true" className="size-8 rounded-lg object-cover" />
        <p className="text-sm font-semibold tracking-tight text-primary">Job Application Copilot</p>
      </div>
      <div className="flex items-center gap-4">
        {hasUnsavedChanges && (
          <span className="hidden items-center gap-1.5 text-xs font-medium text-amber-700 sm:inline-flex" role="status">
            <span className="size-1.5 rounded-full bg-amber-500" aria-hidden="true" />
            Unsaved changes
          </span>
        )}
        <div
          className="flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-primary"
          aria-label="Signed in as Elena Marković"
          role="img"
        >
          JS
        </div>
      </div>
    </header>
  )
}

function Panel({
  title,
  icon: Icon,
  side,
  collapsed,
  onToggle,
  mobileHidden,
  className,
  children,
}: {
  title: string
  icon: typeof Bot
  side: 'left' | 'right'
  collapsed: boolean
  onToggle: () => void
  mobileHidden: boolean
  className?: string
  children: ReactNode
}) {
  const CloseIcon = side === 'left' ? PanelLeftClose : PanelRightClose
  const OpenIcon = side === 'left' ? PanelLeftOpen : PanelRightOpen

  return (
    <section
      aria-label={title}
      className={cn(
        'min-w-0 flex-1 flex-col overflow-hidden bg-canvas lg:rounded-xl lg:border lg:shadow-xs',
        mobileHidden ? 'hidden lg:flex' : 'flex',
        collapsed ? 'lg:w-12 lg:flex-none' : className,
      )}
    >
      {collapsed ? (
        <button
          type="button"
          onClick={onToggle}
          aria-label={`Expand ${title}`}
          className="hidden h-full flex-col items-center gap-3 bg-card py-3 text-muted-foreground transition-colors hover:text-primary lg:flex"
        >
          <OpenIcon className="size-4" aria-hidden="true" />
          <span className="text-xs font-semibold tracking-wide [writing-mode:vertical-rl]">{title}</span>
        </button>
      ) : null}
      <div className={cn('min-h-0 flex-1 flex-col', collapsed ? 'flex lg:hidden' : 'flex')}>
        <div className="hidden h-12 shrink-0 items-center justify-between border-b bg-card px-4 lg:flex">
          <h1 className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
            <Icon className="size-4" aria-hidden="true" />
            {title}
          </h1>
          <button
            type="button"
            onClick={onToggle}
            aria-label={`Collapse ${title}`}
            title={`Collapse ${title}`}
            className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <CloseIcon className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className={cn('min-h-0 flex-1', side === 'right' && 'pt-4 lg:pt-4')}>{children}</div>
      </div>
    </section>
  )
}
