import { getApiBaseUrl } from './api-config'

export interface GenerateApplicationPlanRequest {
  jobAdvertisement: string
  userGuidance?: string | null
}

export interface GenerateApplicationPlanResponse {
  applicationPlan: string
}

export interface GenerateJobApplicationRequest {
  jobAdvertisement: string
  applicationPlan: string
}

export interface GeneratedApplication {
  id: string
  text: string
}

export interface GenerateJobApplicationResponse {
  application: GeneratedApplication
}

interface BasicDetailsResponse {
  profile_id: number
}

interface ApiPlanResponse {
  application_plan: string
}

interface ApiGenerationResponse {
  application_text: string
}

interface ApiValidationIssue {
  loc?: Array<string | number>
  msg?: string
}

interface ApiErrorResponse {
  detail?: string | ApiValidationIssue[]
}

const USER_ID_STORAGE_KEY = 'career-profile-user-id'

function getApiErrorMessage(
  errorBody: ApiErrorResponse | null,
  status: number,
  operation: string,
) {
  const { detail } = errorBody ?? {}
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    const messages = detail
      .map(({ loc, msg }) => {
        if (!msg) return null
        const field = loc?.filter((part) => part !== 'body').join('.')
        return field ? `${field}: ${msg}` : msg
      })
      .filter((message): message is string => message !== null)
    if (messages.length) return messages.join('; ')
  }
  return `${operation} failed (${status}).`
}

async function getProfileId(baseUrl: string): Promise<number> {
  const userId = window.localStorage.getItem(USER_ID_STORAGE_KEY)
  if (!userId) {
    throw new Error('Could not find the current user. Please reload and try again.')
  }

  const response = await fetch(
    `${baseUrl}/users/${encodeURIComponent(userId)}/profile`,
    { cache: 'no-store' },
  )
  if (!response.ok) {
    throw new Error(
      response.status === 404
        ? 'Create a profile before generating an application.'
        : `Could not load your profile (${response.status}).`,
    )
  }

  const basicDetails = (await response.json()) as BasicDetailsResponse
  return basicDetails.profile_id
}

export async function generateApplicationPlan(
  request: GenerateApplicationPlanRequest,
): Promise<GenerateApplicationPlanResponse> {
  const jobAdvertisement = request.jobAdvertisement.trim()
  if (!jobAdvertisement) {
    throw new Error('A job advertisement is required to generate an application.')
  }

  const baseUrl = getApiBaseUrl()
  const profileId = await getProfileId(baseUrl)
  const response = await fetch(`${baseUrl}/applications/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({
      profile_id: profileId,
      job_ad: jobAdvertisement,
      user_guidance: request.userGuidance?.trim() || null,
    }),
  })

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as ApiErrorResponse | null
    throw new Error(getApiErrorMessage(errorBody, response.status, 'Application plan generation'))
  }

  const result = (await response.json()) as ApiPlanResponse
  return { applicationPlan: result.application_plan }
}

export async function generateJobApplication(
  request: GenerateJobApplicationRequest,
): Promise<GenerateJobApplicationResponse> {
  const jobAdvertisement = request.jobAdvertisement.trim()
  const applicationPlan = request.applicationPlan.trim()
  if (!jobAdvertisement) {
    throw new Error('A job advertisement is required to generate an application.')
  }
  if (!applicationPlan) {
    throw new Error('An application plan is required to generate an application.')
  }

  const baseUrl = getApiBaseUrl()
  const profileId = await getProfileId(baseUrl)
  const response = await fetch(`${baseUrl}/applications/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({
      profile_id: profileId,
      job_ad: jobAdvertisement,
      application_plan: applicationPlan,
    }),
  })

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as ApiErrorResponse | null
    throw new Error(getApiErrorMessage(errorBody, response.status, 'Application generation'))
  }

  const result = (await response.json()) as ApiGenerationResponse
  const application = {
    id: crypto.randomUUID(),
    text: result.application_text,
  }
  return { application }
}
