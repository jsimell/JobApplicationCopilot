import { ArrowRight, Sparkles } from "lucide-react";
import { Button, Field, TextArea } from "../../profile/ui";
import { WorkflowProgress } from "../application-workflow-ui";

export function ApplicationSetupStep({
  jobAdvertisement,
  onJobAdvertisementChange,
  letAiDecide,
  onLetAiDecideChange,
  userGuidance,
  onUserGuidanceChange,
  onGeneratePlan,
  hasExistingPlan,
  onReturnToPlan,
}: {
  jobAdvertisement: string;
  onJobAdvertisementChange: (value: string) => void;
  letAiDecide: boolean;
  onLetAiDecideChange: (value: boolean) => void;
  userGuidance: string;
  onUserGuidanceChange: (value: string) => void;
  onGeneratePlan: () => void;
  hasExistingPlan: boolean;
  onReturnToPlan?: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col">
      {onReturnToPlan && (
        <div className="flex justify-end pt-3 pb-4">
          <Button variant="secondary" onClick={onReturnToPlan}>
            Return to application plan
            <ArrowRight className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
          </Button>
        </div>
      )}
      <div className="mb-5 mt-3">
        <h2 className="text-base font-semibold text-foreground">
          Create a tailored application
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          First, AI will create a plan for writing the tailored application. In the next
          step, you can review and edit the plan before generating an application draft.
        </p>
      </div>

      <WorkflowProgress activeStep={1} />

      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="p-4 sm:p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">Job advertisement</h3>
          </div>
          <Field>
            <TextArea
              id="job-advertisement"
              aria-label="Job advertisement"
              rows={8}
              value={jobAdvertisement}
              onChange={(event) => onJobAdvertisementChange(event.target.value)}
              placeholder="Paste the job advertisement here..."
              className="resize-y bg-card"
            />
          </Field>
        </div>

        <div className="border-t p-4 sm:p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">
              Guide the application plan
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Share any context, priorities, or preferences you'd like the AI to consider.
              Detailed guidance may generate higher quality results.
            </p>
          </div>

          <label className="mb-4 flex cursor-pointer items-start gap-3 rounded-lg bg-secondary/50 p-3 text-sm text-foreground/85">
            <input
              type="checkbox"
              checked={letAiDecide}
              onChange={(event) => onLetAiDecideChange(event.target.checked)}
              className="mt-0.5 size-4 shrink-0 rounded border-input accent-primary"
            />
            <span>
              <span className="block font-medium">Let AI decide what to emphasize</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                Create the plan based on the job ad and my profile, without additional
                guidance.
              </span>
            </span>
          </label>

          {!letAiDecide && (
            <Field label="Additional guidance" htmlFor="application-guidance">
              <TextArea
                id="application-guidance"
                rows={3}
                value={userGuidance}
                onChange={(event) => onUserGuidanceChange(event.target.value)}
                placeholder="For example: The role is open-ended, so present me as open to opportunities that fit my strengths, interests, and experience. Highlight my eagerness to learn and start my career, along with my goal of becoming a well-rounded professional."
                className="bg-card"
              />
            </Field>
          )}
        </div>
      </section>

      <div className="mt-5 flex justify-center">
        <Button
          variant="primary"
          size="md"
          onClick={onGeneratePlan}
          disabled={!jobAdvertisement.trim()}
          className="h-10 px-5"
        >
          <Sparkles className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
          {hasExistingPlan ? "Regenerate application plan" : "Generate application plan"}
        </Button>
      </div>
    </div>
  );
}
