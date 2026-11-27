import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import { Button, Field, TextArea } from '../../profile/ui'
import { SectionCardHeader } from '../../shared/section-card-header'

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
    <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col px-4 py-6 sm:py-6">
      <div className="mb-4 flex h-10 shrink-0 items-center justify-between gap-3">
        <Button variant="secondary" onClick={onBack}>
          <ArrowLeft className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
          Back to job details
        </Button>
        {hasGeneratedApplication ? (
          <Button variant="secondary" onClick={onReturnToApplication} className="h-10">
            Return to application
            <ArrowRight className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
          </Button>
        ) : (
          <Button
            variant="primary"
            size="md"
            onClick={onGenerateApplication}
            disabled={!applicationPlan.trim()}
            className="h-10 px-5"
          >
            <Sparkles className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
            Generate application
          </Button>
        )}
      </div>
      <section
        aria-labelledby="application-plan-title"
        className="rounded-xl border bg-card shadow-sm"
      >
        <SectionCardHeader
          titleId="application-plan-title"
          icon={<span className="text-sm font-semibold">2</span>}
          title="Review the application plan"
          description="AI has drafted a plan using the job ad and your profile. Edit it as needed; the application will follow the version you provide here."
        />
        <div className="px-5 py-5 sm:px-6">
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
      </section>
    </div>
  )
}
