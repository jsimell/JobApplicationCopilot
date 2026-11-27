'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronUp, Menu } from 'lucide-react'
import { cn } from '@/services/utils'
import { generateApplicationPlan, generateJobApplication } from '@/services/job-application-api'
import type { GeneratedApplication } from '@/services/job-application-api'
import { ApplicationLoadingStep } from './steps/application-loading-step'
import { ApplicationPlanStep } from './steps/application-plan-step'
import { ApplicationSetupStep } from './steps/application-setup-step'
import { ApplicationWorkspace } from './steps/application-workspace'
import { GenerationError } from './application-workflow-ui'

type PanelView = 'setup' | 'planning' | 'plan' | 'generating' | 'editor'
type ApplicationStep = 1 | 2 | 3

const APPLICATION_STEPS: {
  step: ApplicationStep
  title: string
  description: string
}[] = [
  {
    step: 1,
    title: 'Job details',
    description: 'Add the job ad and optional guidance.',
  },
  {
    step: 2,
    title: 'Review plan',
    description: 'Review and edit the AI-generated plan.',
  },
  {
    step: 3,
    title: 'Write application',
    description: 'Edit and export your application draft.',
  },
]

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export function AiAssistantPanel({ sidebarNavigation }: { sidebarNavigation: ReactNode }) {
  const [view, setView] = useState<PanelView>('setup')
  const [mobileStepsOpen, setMobileStepsOpen] = useState(false)
  const [mobileStepsVisible, setMobileStepsVisible] = useState(true)
  const [jobAdvertisement, setJobAdvertisement] = useState('')
  const [letAiDecideEmphasis, setLetAiDecideEmphasis] = useState(false)
  const [userGuidance, setUserGuidance] = useState('')
  const [applicationPlan, setApplicationPlan] = useState('')
  const [application, setApplication] = useState<GeneratedApplication | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [error, setError] = useState<string | null>(null)
  const contentScrollRef = useRef<HTMLDivElement>(null)
  const lastScrollTopRef = useRef(0)
  const scrollDirectionRef = useRef(0)
  const scrollDistanceRef = useRef(0)

  useEffect(() => {
    const root = contentScrollRef.current
    if (!root) return

    lastScrollTopRef.current = root.scrollTop
    const handleScroll = () => {
      const currentTop = root.scrollTop
      const delta = currentTop - lastScrollTopRef.current
      lastScrollTopRef.current = currentTop

      if (currentTop <= 8) {
        scrollDirectionRef.current = 0
        scrollDistanceRef.current = 0
        if (delta < 0) setMobileStepsVisible(true)
        return
      }

      const direction = Math.sign(delta)
      if (direction === 0) return
      if (direction !== scrollDirectionRef.current) {
        scrollDirectionRef.current = direction
        scrollDistanceRef.current = 0
      }
      scrollDistanceRef.current += Math.abs(delta)
      if (scrollDistanceRef.current < 10) return

      setMobileStepsVisible(direction < 0)
      if (direction > 0) setMobileStepsOpen(false)
      scrollDistanceRef.current = 0
    }

    root.addEventListener('scroll', handleScroll, { passive: true })
    return () => root.removeEventListener('scroll', handleScroll)
  }, [])

  const generatePlan = async () => {
    if (!jobAdvertisement.trim()) return

    const consequences = []
    if (applicationPlan.trim()) consequences.push('replace your current application plan')
    if (application) consequences.push('discard your current application draft and any edits')
    if (consequences.length && !window.confirm(`Generating a new plan will ${consequences.join(' and ')}. Continue?`)) {
      return
    }

    setError(null)
    setView('planning')

    try {
      const response = await generateApplicationPlan({
        jobAdvertisement,
        userGuidance: letAiDecideEmphasis ? null : userGuidance,
      })
      if (application) {
        setApplication(null)
        setMessages([])
      }
      setApplicationPlan(response.applicationPlan)
      setView('plan')
    } catch (planError) {
      setError(
        planError instanceof Error
          ? planError.message
          : 'Could not generate an application plan. Please try again.',
      )
      setView('setup')
    }
  }

  const generate = async () => {
    if (!jobAdvertisement.trim() || !applicationPlan.trim()) return

    if (
      application &&
      !window.confirm('Generating a new application will replace your current draft and any edits. Continue?')
    ) {
      return
    }

    setError(null)
    setView('generating')

    try {
      const response = await generateJobApplication({ jobAdvertisement, applicationPlan })
      setApplication(response.application)
      setMessages([])
      setView('editor')
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : 'Could not generate your application. Please try again.',
      )
      setView('plan')
    }
  }

  const isBusy = view === 'planning' || view === 'generating'
  const activeStep: ApplicationStep =
    view === 'setup' ? 1 : view === 'planning' || view === 'plan' ? 2 : 3
  const canAccessStep = (step: ApplicationStep) =>
    !isBusy &&
    (step === 1 ||
      (step === 2 && Boolean(applicationPlan.trim())) ||
      (step === 3 && application !== null))
  const navigateToStep = (step: ApplicationStep) => {
    if (!canAccessStep(step)) return
    setError(null)
    setView(step === 1 ? 'setup' : step === 2 ? 'plan' : 'editor')
    if (window.matchMedia('(max-width: 767px)').matches) {
      setMobileStepsOpen(false)
      setMobileStepsVisible(false)
    }
  }

  const renderStepButtons = () =>
    APPLICATION_STEPS.map(({ step, title, description }) => {
      const isAvailable = canAccessStep(step)
      const isCurrent = activeStep === step
      return (
        <li key={step}>
          <button
            type="button"
            disabled={!isAvailable}
            aria-current={isCurrent ? 'step' : undefined}
            onClick={() => navigateToStep(step)}
            className={cn(
              'flex min-h-14 w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isCurrent
                ? 'bg-secondary text-primary'
                : isAvailable
                  ? 'text-foreground hover:bg-muted'
                  : 'cursor-not-allowed text-muted-foreground/60',
            )}
          >
            <span
              className={cn(
                'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                isCurrent
                  ? 'border-primary bg-primary text-primary-foreground'
                  : isAvailable
                    ? 'border-border bg-card text-foreground'
                    : 'border-border/60 bg-muted text-muted-foreground/60',
              )}
            >
              {step}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium">{title}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                {description}
              </span>
            </span>
          </button>
        </li>
      )
    })

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas md:flex-row">
      <aside className="shrink-0 border-b bg-background md:flex-[0_0_20rem] md:border-b-0 md:border-r">
        <div className="border-b p-2">{sidebarNavigation}</div>
        <div className="relative h-11 md:hidden">
          <div
            aria-hidden={!mobileStepsVisible}
            inert={!mobileStepsVisible}
            className={cn(
              'absolute inset-x-0 top-0 z-20 bg-background transition-[opacity,transform] duration-300 ease-in-out motion-reduce:transition-none',
              mobileStepsVisible
                ? 'translate-y-0 opacity-100'
                : 'pointer-events-none -translate-y-full opacity-0',
            )}
          >
            <button
              type="button"
              aria-expanded={mobileStepsOpen}
              aria-controls="mobile-application-steps"
              onClick={() => setMobileStepsOpen((open) => !open)}
              tabIndex={mobileStepsVisible ? 0 : -1}
              className="flex h-11 w-full items-center justify-between border-b px-4 text-sm font-medium text-foreground"
            >
              <span>Application steps</span>
              {mobileStepsOpen ? (
                <ChevronUp className="size-4 text-muted-foreground" aria-hidden="true" />
              ) : (
                <Menu className="size-4 text-muted-foreground" aria-hidden="true" />
              )}
            </button>
            {mobileStepsOpen && (
              <nav
                id="mobile-application-steps"
                aria-label="Application generation steps"
                className="border-b bg-background px-2 py-2 shadow-md"
              >
                <ol className="flex flex-col gap-1">{renderStepButtons()}</ol>
              </nav>
            )}
          </div>
        </div>
        <nav aria-label="Application generation steps" className="hidden p-2 md:block md:py-5">
          <ol className="flex flex-col gap-1">
            {renderStepButtons()}
          </ol>
        </nav>
      </aside>

      <div ref={contentScrollRef} className="min-h-0 flex-1 overflow-y-auto">
        {error && (
          <div className="mx-auto w-full max-w-2xl px-4 pt-4">
            <GenerationError message={error} onDismiss={() => setError(null)} />
          </div>
        )}

        {isBusy ? (
          <ApplicationLoadingStep
            message={
              view === 'planning'
                ? 'Creating your application plan…'
                : 'Writing your application…'
            }
          />
        ) : view === 'editor' && application ? (
          <ApplicationWorkspace
            application={application}
            onApplicationChange={setApplication}
            messages={messages}
            onBack={() => setView('plan')}
          />
        ) : view === 'plan' ? (
          <ApplicationPlanStep
            applicationPlan={applicationPlan}
            onApplicationPlanChange={setApplicationPlan}
            onBack={() => {
              setError(null)
              setView('setup')
            }}
            onGenerateApplication={generate}
            hasGeneratedApplication={application !== null}
            onReturnToApplication={() => {
              setError(null)
              setView('editor')
            }}
          />
        ) : (
          <ApplicationSetupStep
            jobAdvertisement={jobAdvertisement}
            onJobAdvertisementChange={setJobAdvertisement}
            letAiDecide={letAiDecideEmphasis}
            onLetAiDecideChange={setLetAiDecideEmphasis}
            userGuidance={userGuidance}
            onUserGuidanceChange={setUserGuidance}
            onGeneratePlan={generatePlan}
            hasExistingPlan={Boolean(applicationPlan.trim())}
            onReturnToPlan={
              applicationPlan
                ? () => {
                    setError(null)
                    setView('plan')
                  }
                : undefined
            }
          />
        )}
      </div>
    </div>
  )
}
