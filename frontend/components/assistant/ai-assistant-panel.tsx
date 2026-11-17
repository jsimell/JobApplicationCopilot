'use client'

import { useState } from 'react'
import { AlertCircle, ArrowLeft, ArrowRight, Bot, Download, Send, Sparkles, X } from 'lucide-react'
import { cn } from '@/services/utils'
import { generateJobApplication } from '@/services/job-application-api'
import type { ApplicationSession, GeneratedApplication } from '@/services/job-application-api'
import { Button, Field, TextArea } from '../profile/ui'

type PanelView = 'setup' | 'loading' | 'editor'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export function AiAssistantPanel() {
  const [view, setView] = useState<PanelView>('setup')
  const [jobAdvertisement, setJobAdvertisement] = useState('')
  const [application, setApplication] = useState<GeneratedApplication | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [error, setError] = useState<string | null>(null)

  const generate = async () => {
    if (!jobAdvertisement.trim()) return

    if (
      application &&
      !window.confirm('Generating a new application will discard your current application. Continue?')
    ) {
      return
    }

    setError(null)
    setView('loading')

    try {
      const response = await generateJobApplication({ jobAdvertisement })
      const nextSession: ApplicationSession = {
        id: response.application.id,
        jobAdvertisement,
        application: response.application,
      }
      setApplication(nextSession.application)
      setMessages([])
      setView('editor')
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : 'Could not generate your application. Please try again.',
      )
      setView('setup')
    }
  }

  if (view === 'loading') return <LoadingView />

  if (view === 'editor' && application) {
    return (
      <ApplicationWorkspace
        application={application}
        onApplicationChange={setApplication}
        messages={messages}
        onBack={() => setView('setup')}
      />
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto px-4 pb-4 pt-1">
      {application && (
        <div className="pt-3 pb-4 flex justify-end">
          <Button variant="secondary" onClick={() => setView('editor')}>
            Return to application
            <ArrowRight className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
          </Button>
        </div>
      )}
      {error && <GenerationError message={error} onDismiss={() => setError(null)} />}

      <div className="mx-auto flex w-full max-w-2xl flex-col">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-foreground">Start with a job advertisement</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Share the job posting to generate an application tailored to the role.
          </p>
        </div>

        <Field label="Job advertisement" htmlFor="job-advertisement">
          <TextArea
            id="job-advertisement"
            rows={10}
            value={jobAdvertisement}
            onChange={(event) => setJobAdvertisement(event.target.value)}
            placeholder="Paste the job advertisement here..."
            className="min-h-56 resize-y bg-card"
          />
        </Field>

        <div className="mt-5 flex justify-center">
          <Button
            variant="primary"
            size="md"
            onClick={generate}
            disabled={!jobAdvertisement.trim()}
            className="h-10 px-5"
          >
            <Sparkles className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
            Generate tailored application
          </Button>
        </div>
      </div>
    </div>
  )
}

function LoadingView() {
  return (
    <div className="flex h-full flex-col items-center px-5 pt-16 text-center sm:pt-20">
      <span className="size-10 animate-spin rounded-full border-4 border-primary/15 border-t-primary" aria-hidden="true" />
      <p className="mt-5 text-sm font-medium text-foreground" role="status" aria-live="polite">
        Generating your tailored application...
      </p>
    </div>
  )
}

function GenerationError({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div
      role="alert"
      className="mb-5 flex items-start gap-2.5 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p className="flex-1 leading-relaxed">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss error"
        className="shrink-0 rounded p-0.5 transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
      </button>
    </div>
  )
}

function ApplicationWorkspace({
  application,
  onApplicationChange,
  messages,
  onBack,
}: {
  application: GeneratedApplication
  onApplicationChange: (application: GeneratedApplication) => void
  messages: ChatMessage[]
  onBack: () => void
}) {
  const exportApplication = () => {
    const file = new Blob([application.text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = 'tailored-application.txt'
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto px-4 pb-4 pt-3">
      <Button variant="secondary" onClick={onBack} className="mb-3 self-start px-2">
        <ArrowLeft className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
        Back to setup
      </Button>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 2xl:grid-cols-2 2xl:overflow-hidden">
        <section className="flex min-h-120 min-w-0 flex-col rounded-xl border bg-card p-4 2xl:min-h-0">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-foreground">Application editor</h2>
            <p className="mt-1 text-xs text-muted-foreground">Edit your draft before exporting it.</p>
          </div>
          <label htmlFor="application-editor" className="sr-only">
            Generated application
          </label>
          <TextArea
            id="application-editor"
            value={application.text}
            onChange={(event) => onApplicationChange({ ...application, text: event.target.value })}
            className="min-h-64 flex-1 resize-y leading-relaxed"
          />
          <div className="mt-3 flex justify-end">
            <Button variant="secondary" onClick={exportApplication}>
              <Download className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
              Export application text
            </Button>
          </div>
        </section>

        <ApplicationChat messages={messages} />
      </div>
    </div>
  )
}

function ApplicationChat({ messages }: { messages: ChatMessage[] }) {
  return (
    <section className="flex min-h-96 min-w-0 flex-col overflow-hidden rounded-xl border bg-card 2xl:min-h-0">
      <div className="shrink-0 border-b px-4 py-3">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
          <Bot className="size-4 text-primary" aria-hidden="true" />
          AI chat
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">Refine your application with AI</p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-canvas/60 p-4">
        {messages.length === 0 ? (
          <div className="my-auto flex items-start gap-2.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
              <Bot className="size-4" aria-hidden="true" />
            </span>
            <p className="max-w-[85%] rounded-2xl rounded-tl-sm border bg-card px-3 py-2.5 text-sm leading-relaxed text-muted-foreground">
              Your draft is ready. AI-powered refinement will be available here soon.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn('flex items-start gap-2.5', message.role === 'user' && 'justify-end')}
            >
              {message.role === 'assistant' && (
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                  <Bot className="size-4" aria-hidden="true" />
                </span>
              )}
              <p
                className={cn(
                  'max-w-[85%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed',
                  message.role === 'user'
                    ? 'rounded-tr-sm bg-primary text-primary-foreground'
                    : 'rounded-tl-sm border bg-card text-foreground',
                )}
              >
                {message.content}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2 border-t bg-card p-3">
        <label htmlFor="ai-refinement-input" className="sr-only">
          Message the AI assistant
        </label>
        <input
          id="ai-refinement-input"
          disabled
          placeholder="Ask for a refinement..."
          className="h-9 min-w-0 flex-1 rounded-md border border-input bg-muted/50 px-3 text-sm text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed"
        />
        <Button variant="primary" size="icon" disabled aria-label="Send message">
          <Send className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
        </Button>
      </div>
    </section>
  )
}
