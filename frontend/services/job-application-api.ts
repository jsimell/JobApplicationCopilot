import { getApiBaseUrl } from './api-config'

export interface GenerateJobApplicationRequest {
  jobAdvertisement: string
}

export interface GeneratedApplication {
  id: string
  text: string
}

export interface GenerateJobApplicationResponse {
  application: GeneratedApplication
}

export interface ApplicationSession {
  id: string
  jobAdvertisement: string
  application: GeneratedApplication
}

interface BasicDetailsResponse {
  profile_id: number
}

interface ApiGenerationResponse {
  application_text: string
}

interface ApiErrorResponse {
  detail?: string
}

const USER_ID_STORAGE_KEY = 'career-profile-user-id'

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

export async function generateJobApplication(
  request: GenerateJobApplicationRequest,
): Promise<GenerateJobApplicationResponse> {
  const jobAdvertisement = request.jobAdvertisement.trim()
  if (!jobAdvertisement) {
    throw new Error('A job advertisement is required to generate an application.')
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
    }),
  })

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as ApiErrorResponse | null
    throw new Error(
      errorBody?.detail ?? `Application generation failed (${response.status}).`,
    )
  }

  const result = (await response.json()) as ApiGenerationResponse
  const application = {
    id: crypto.randomUUID(),
    text: result.application_text,
  }
  return { application }
}
