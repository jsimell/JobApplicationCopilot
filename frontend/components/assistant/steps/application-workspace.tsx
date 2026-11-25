import { ArrowLeft, Bot, Download, Send } from 'lucide-react'
import { cn } from '@/services/utils'
import type { GeneratedApplication } from '@/services/job-application-api'
import { Button, TextArea } from '../../profile/ui'
import { WorkflowProgress } from '../application-workflow-ui'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export function ApplicationWorkspace({
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
        Back to plan
      </Button>

      <div className="mx-auto w-full max-w-2xl">
        <WorkflowProgress activeStep={3} />
      </div>

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
            autoResize
            value={application.text}
            onChange={(event) => onApplicationChange({ ...application, text: event.target.value })}
            className="resize-y leading-relaxed"
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
