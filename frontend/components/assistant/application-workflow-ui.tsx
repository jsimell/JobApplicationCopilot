import { AlertCircle, Check, X } from 'lucide-react'

export function WorkflowProgress({ activeStep }: { activeStep: 1 | 2 | 3 }) {
  const steps = ['Job details', 'Review plan', 'Write application']

  return (
    <ol aria-label="Application writing steps" className="mb-6 grid grid-cols-3">
      {steps.map((step, index) => {
        const stepNumber = index + 1
        const isComplete = stepNumber < activeStep
        const isActive = stepNumber === activeStep
        return (
          <li key={step} className="flex flex-col items-center gap-2 text-center">
            <span
              aria-current={isActive ? 'step' : undefined}
              className={`flex size-7 items-center justify-center rounded-full border text-xs font-semibold ${
                isComplete
                  ? 'border-primary bg-primary text-primary-foreground'
                  : isActive
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground'
              }`}
            >
              {isComplete ? <Check className="size-3.5" aria-hidden="true" /> : stepNumber}
            </span>
            <span className={`text-xs ${isActive ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
              {step}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export function GenerationError({ message, onDismiss }: { message: string; onDismiss: () => void }) {
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
