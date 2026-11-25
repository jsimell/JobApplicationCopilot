import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import { Button, Field, TextArea } from '../../profile/ui'
import { WorkflowProgress } from '../application-workflow-ui'

export function ApplicationPlanStep({
  applicationPlan,
  onApplicationPlanChange,
  onBack,
  onGenerateApplication,
  hasGeneratedApplication,
  onReturnToApplication,
}: {
  applicationPlan: string
  onApplicationPlanChange: (value: string) => void
  onBack: () => void
  onGenerateApplication: () => void
  hasGeneratedApplication: boolean
  onReturnToApplication: () => void
}) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col">
      <div className="flex items-center justify-between gap-3 pt-3 pb-4">
        <Button variant="secondary" onClick={onBack}>
          <ArrowLeft className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
          Back to job details
        </Button>
        {hasGeneratedApplication && (
          <Button variant="secondary" onClick={onReturnToApplication}>
            Return to application
            <ArrowRight className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
          </Button>
        )}
      </div>
      <div className="mb-5 mt-3">
        <h2 className="text-base font-semibold text-foreground">Review the application plan</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          AI has drafted a plan using the job ad and your profile. Edit it as needed; the application will follow the
          version you provide here.
        </p>
      </div>

      <WorkflowProgress activeStep={2} />

      <section className="rounded-xl border bg-card p-4 sm:p-5">
        <Field label="Edit application plan" htmlFor="application-plan">
          <TextArea
            id="application-plan"
            autoResize
            rows={8}
            value={applicationPlan}
            onChange={(event) => onApplicationPlanChange(event.target.value)}
            placeholder="Your application plan will appear here..."
            className="bg-card"
          />
        </Field>
      </section>

      <div className="mt-5 flex justify-center">
        <Button
          variant="primary"
          size="md"
          onClick={onGenerateApplication}
          disabled={!applicationPlan.trim()}
          className="h-10 px-5"
        >
          <Sparkles className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
          {hasGeneratedApplication ? 'Regenerate application' : 'Generate application'}
        </Button>
      </div>
    </div>
  )
}
