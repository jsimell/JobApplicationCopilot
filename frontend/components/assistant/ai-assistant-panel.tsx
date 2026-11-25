'use client'

import { useState } from 'react'
import { generateApplicationPlan, generateJobApplication } from '@/services/job-application-api'
import type { GeneratedApplication } from '@/services/job-application-api'
import { ApplicationLoadingStep } from './steps/application-loading-step'
import { ApplicationPlanStep } from './steps/application-plan-step'
import { ApplicationSetupStep } from './steps/application-setup-step'
import { ApplicationWorkspace } from './steps/application-workspace'
import { GenerationError } from './application-workflow-ui'

type PanelView = 'setup' | 'planning' | 'plan' | 'generating' | 'editor'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export function AiAssistantPanel() {
  const [view, setView] = useState<PanelView>('setup')
  const [jobAdvertisement, setJobAdvertisement] = useState('')
  const [letAiDecideEmphasis, setLetAiDecideEmphasis] = useState(false)
  const [userGuidance, setUserGuidance] = useState('')
  const [applicationPlan, setApplicationPlan] = useState('')
  const [application, setApplication] = useState<GeneratedApplication | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [error, setError] = useState<string | null>(null)

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

  if (view === 'planning' || view === 'generating') {
    return (
      <ApplicationLoadingStep
        activeStep={view === 'planning' ? 2 : 3}
        message={view === 'planning' ? 'Creating your application plan…' : 'Writing your application…'}
      />
    )
  }

  if (view === 'editor' && application) {
    return (
      <ApplicationWorkspace
        application={application}
        onApplicationChange={setApplication}
        messages={messages}
        onBack={() => setView('plan')}
      />
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto px-4 pb-4 pt-1">
      {error && <GenerationError message={error} onDismiss={() => setError(null)} />}

      {view === 'plan' ? (
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
          onReturnToPlan={applicationPlan ? () => {
            setError(null)
            setView('plan')
          } : undefined}
        />
      )}
    </div>
  )
}
