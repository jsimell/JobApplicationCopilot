'use client'

import { useState } from 'react'
import { Bot, UserRound } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/services/utils'
import appLogo from '@/assets/appLogo.png'
import { AiAssistantPanel } from './assistant/ai-assistant-panel'
import { EditorProvider, useEditor } from './shared/editor-context'
import { ProfilePanel } from './profile/profile-panel'

type Destination = 'profile' | 'applications'

export function CareerProfileApp() {
  return (
    <EditorProvider>
      <AppShell />
    </EditorProvider>
  )
}

function AppShell() {
  const [destination, setDestination] = useState<Destination>('profile')
  const [fullName, setFullName] = useState<string | null>(null)
  const { guardNavigation } = useEditor()
  const navigate = (nextDestination: Destination) => {
    if (nextDestination === destination) return
    guardNavigation(() => setDestination(nextDestination))
  }
  const sidebarNavigation = (
    <MainNavigation destination={destination} onNavigate={navigate} />
  )

  return (
    <div className="flex h-dvh flex-col">
      <TopBar fullName={fullName} />

      <main className="min-h-0 flex-1 overflow-hidden bg-canvas">
        <div
          aria-label="Career Profile"
          hidden={destination !== 'profile'}
          className="h-full min-h-0"
        >
          <ProfilePanel
            sidebarNavigation={sidebarNavigation}
            onFullNameChange={setFullName}
          />
        </div>
        <div
          aria-label="Applications"
          hidden={destination !== 'applications'}
          className="h-full min-h-0"
        >
          <AiAssistantPanel sidebarNavigation={sidebarNavigation} />
        </div>
      </main>
    </div>
  )
}

function TopBar({ fullName }: { fullName: string | null }) {
  const { hasUnsavedChanges } = useEditor()
  return (
    <div className="relative z-20 shrink-0 border-b bg-card">
      <header className="flex h-14 items-center justify-between gap-3 px-4 sm:px-5">
        <Brand />
        <UserControls hasUnsavedChanges={hasUnsavedChanges} fullName={fullName} />
      </header>
    </div>
  )
}

function Brand() {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Image src={appLogo} alt="" aria-hidden="true" className="size-8 shrink-0 rounded-lg object-cover" />
      <p className="truncate text-sm font-semibold tracking-tight text-primary">Job Application Copilot</p>
    </div>
  )
}

function UserControls({
  hasUnsavedChanges,
  fullName,
}: {
  hasUnsavedChanges: boolean
  fullName: string | null
}) {
  const nameParts = fullName?.trim().split(/\s+/).filter(Boolean) ?? []
  const initials = nameParts.length > 1
    ? `${Array.from(nameParts[0])[0]}${Array.from(nameParts[nameParts.length - 1])[0]}`.toLocaleUpperCase()
    : Array.from(nameParts[0] ?? '')[0]?.toLocaleUpperCase()

  return (
    <div className="flex shrink-0 items-center gap-3">
      {hasUnsavedChanges && (
        <span className="hidden items-center gap-1.5 text-xs font-medium text-amber-700 sm:inline-flex">
          <span className="size-1.5 rounded-full bg-amber-500" aria-hidden="true" />
          Unsaved changes
        </span>
      )}
      <div
        className="flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-primary"
        aria-label={fullName ? `Signed in as ${fullName}` : 'User profile'}
        role="img"
      >
        {initials || <UserRound className="size-4" aria-hidden="true" />}
      </div>
    </div>
  )
}

function MainNavigation({
  destination,
  onNavigate,
  className,
}: {
  destination: Destination
  onNavigate: (destination: Destination) => void
  className?: string
}) {
  const destinations = [
    { id: 'profile', label: 'Career Profile', icon: UserRound },
    { id: 'applications', label: 'Applications', icon: Bot },
  ] as const

  return (
    <nav
      aria-label="Main navigation"
      className={cn('flex w-full min-w-0 gap-1 rounded-lg bg-muted p-1', className)}
    >
      {destinations.map(({ id, label, icon: Icon }) => {
        const isCurrent = destination === id
        return (
          <button
            key={id}
            type="button"
            aria-current={isCurrent ? 'page' : undefined}
            onClick={() => onNavigate(id)}
            className={cn(
              'inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md px-2 text-sm font-medium transition-colors sm:gap-2',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              isCurrent
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:bg-card/70 hover:text-foreground',
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            <span className="whitespace-nowrap">{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
