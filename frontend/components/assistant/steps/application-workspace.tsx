import { ArrowLeft, Bot, Download, Send } from 'lucide-react'
import { cn } from '@/services/utils'
import type { GeneratedApplication } from '@/services/job-application-api'
import { Button, TextArea } from '../../profile/ui'
import { SectionCardHeader } from '../../shared/section-card-header'

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
    <div className="mx-auto flex min-h-full w-full flex-col px-4 py-6 sm:py-6 xl:h-full xl:min-h-0">
      <div className="mb-4 flex h-10 shrink-0 items-center">
        <Button variant="secondary" onClick={onBack} className="self-start px-2">
          <ArrowLeft className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
          Back to plan
        </Button>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-6 xl:min-h-0 xl:flex-1 xl:grid-cols-2 xl:grid-rows-1">
        <section
          aria-labelledby="application-editor-title"
          className="flex min-h-120 min-w-0 flex-col rounded-xl border bg-card shadow-sm xl:min-h-0"
        >
          <SectionCardHeader
            titleId="application-editor-title"
            icon={<span className="text-sm font-semibold">3</span>}
            title="Application editor"
            description="Edit your draft before exporting it."
          />
          <div className="flex min-h-0 flex-1 flex-col px-5 py-5 sm:px-6">
            <label htmlFor="application-editor" className="sr-only">
              Generated application
            </label>
            <TextArea
              id="application-editor"
              autoResize
              value={application.text}
              onChange={(event) =>
                onApplicationChange({ ...application, text: event.target.value })
              }
              className="resize-y leading-relaxed xl:max-h-full xl:min-h-0 xl:flex-1"
            />
            <div className="mt-3 flex justify-end">
              <Button variant="secondary" onClick={exportApplication}>
                <Download className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
                Export application text
              </Button>
            </div>
          </div>
        </section>

        <ApplicationChat messages={messages} />
      </div>
    </div>
  )
}

function ApplicationChat({ messages }: { messages: ChatMessage[] }) {
  return (
    <section
      aria-labelledby="application-chat-title"
      className="flex min-h-96 min-w-0 flex-col overflow-hidden rounded-xl border bg-card shadow-sm xl:min-h-0"
    >
      <SectionCardHeader
        titleId="application-chat-title"
        icon={<Bot className="size-4.5" aria-hidden="true" />}
        title="AI chat"
        description="Refine your application with AI"
      />

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-canvas/60 px-5 py-5 sm:px-6">
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

      <div className="flex shrink-0 items-center gap-2 border-t bg-card px-5 py-4 sm:px-6">
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
