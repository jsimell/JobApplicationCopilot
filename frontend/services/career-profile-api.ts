import type {
  BasicDetails,
  CareerProfile,
  Degree,
  Hobby,
  Language,
  Project,
  Skill,
  WorkExperience,
} from '../components/career/types'

type ApiDegree = Omit<Degree, 'id'> & { degree_id: number }
type ApiHobby = Omit<Hobby, 'id'> & { hobby_id: number }
type ApiLanguage = Omit<Language, 'id'> & { language_id: number }
type ApiProject = Omit<Project, 'id' | 'skill_ids'> & { project_id: number }
type ApiSkill = Omit<Skill, 'id'> & { skill_id: number }
type ApiWorkExperience = Omit<WorkExperience, 'id'> & { work_experience_id: number }
type ApiProjectSkill = { project_id: number; skill_id: number }
type ApiUser = { user_id: string }
type ApiBasicDetails = Omit<BasicDetails, 'full_name' | 'headline'> & {
  full_name: string | null
  headline: string | null
}

export interface CreateProfileInput {
  full_name: string
  headline: string
  location: string | null
  summary: string | null
  career_goals_description: string | null
}

const USER_ID_STORAGE_KEY = 'career-profile-user-id'

class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Returns the base URL without a trailing slash 'https://example.com/api' or throws if not configured.
function getApiBaseUrl() {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
  if (!configuredBaseUrl) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL must be set to load a career profile.')
  }
  return configuredBaseUrl.replace(/\/+$/, '')
}

async function requestJson<T>(
  baseUrl: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    cache: 'no-store',
    ...init,
  })
  if (!response.ok) {
    throw new ApiError(
      `${init?.method ?? 'GET'} ${path} failed: ${response.status} ${response.statusText}`,
      response.status,
    )
  }
  return response.json() as Promise<T>
}

async function getJson<T>(baseUrl: string, path: string): Promise<T> {
  return requestJson<T>(baseUrl, path)
}

async function getOrCreateUserId(baseUrl: string) {
  const existingUserId = window.localStorage.getItem(USER_ID_STORAGE_KEY)
  if (existingUserId) return existingUserId

  const { user_id: createdUserId } = await requestJson<ApiUser>(baseUrl, '/users', {
    method: 'POST',
  })
  window.localStorage.setItem(USER_ID_STORAGE_KEY, createdUserId)
  return createdUserId
}

async function getProfileForUser(baseUrl: string, userId: string) {
  const userPath = `/users/${encodeURIComponent(userId)}/profile`
  try {
    return await getJson<BasicDetails>(baseUrl, userPath)
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 404) throw error
  }
  return null
}

/**
 * Loads and combines the profile and all its related records from the API.
 * Set NEXT_PUBLIC_API_BASE_URL to the backend origin, then pass the profile ID.
 */
export async function fetchCareerProfile(profileId: number): Promise<CareerProfile> {
  const baseUrl = getApiBaseUrl()
  const profilePath = `/profiles/${profileId}`
  const apiBasicDetails = await getJson<ApiBasicDetails>(baseUrl, profilePath)
  const basicDetails: BasicDetails = {
    ...apiBasicDetails,
    full_name: apiBasicDetails.full_name ?? '',
    headline: apiBasicDetails.headline ?? '',
  }

  const [degrees, workExperiences, skills, projects, languages, hobbies] = await Promise.all([
    getJson<ApiDegree[]>(baseUrl, `${profilePath}/degrees`),
    getJson<ApiWorkExperience[]>(baseUrl, `${profilePath}/work_experiences`),
    getJson<ApiSkill[]>(baseUrl, `${profilePath}/skills`),
    getJson<ApiProject[]>(baseUrl, `${profilePath}/projects`),
    getJson<ApiLanguage[]>(baseUrl, `${profilePath}/languages`),
    getJson<ApiHobby[]>(baseUrl, `${profilePath}/hobbies`),
  ])

  const projectSkills = await Promise.all(
    projects.map((project) =>
      getJson<ApiProjectSkill[]>(baseUrl, `/projects/${project.project_id}/skills`),
    ),
  )

  return {
    basic_details: basicDetails,
    degrees: degrees.map(({ degree_id, ...degree }) => ({ ...degree, id: degree_id })),
    work_experiences: workExperiences.map(({ work_experience_id, ...experience }) => ({
      ...experience,
      id: work_experience_id,
    })),
    skills: skills.map(({ skill_id, ...skill }) => ({ ...skill, id: skill_id })),
    projects: projects.map(({ project_id, ...project }, index) => ({
      ...project,
      id: project_id,
      skill_ids: projectSkills[index].map(({ skill_id }) => skill_id),
    })),
    languages: languages.map(({ language_id, ...language }) => ({ ...language, id: language_id })),
    hobbies: hobbies.map(({ hobby_id, ...hobby }) => ({ ...hobby, id: hobby_id })),
  }
}

let pendingInitialization: Promise<CareerProfile | null> | null = null

/** Reuses a local prototype user, creating its user record when needed. */
export function loadCurrentCareerProfile(): Promise<CareerProfile | null> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Career profiles can only be loaded in the browser.'))
  }
  if (pendingInitialization) return pendingInitialization

  const initialization = (async () => {
    const baseUrl = getApiBaseUrl()
    const userId = await getOrCreateUserId(baseUrl)
    const basicDetails = await getProfileForUser(baseUrl, userId)
    if (!basicDetails) return null
    return fetchCareerProfile(basicDetails.profile_id)
  })()

  pendingInitialization = initialization
  void initialization.then(
    () => {
      if (pendingInitialization === initialization) pendingInitialization = null
    },
    () => {
      if (pendingInitialization === initialization) pendingInitialization = null
    },
  )
  return initialization
}

/** Creates the current user's initial profile after they submit the onboarding form. */
export async function createCurrentCareerProfile(input: CreateProfileInput): Promise<CareerProfile> {
  if (typeof window === 'undefined') {
    throw new Error('Career profiles can only be created in the browser.')
  }
  const baseUrl = getApiBaseUrl()
  const userId = await getOrCreateUserId(baseUrl)
  const createdProfile = await requestJson<ApiBasicDetails>(baseUrl, '/profiles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...input, user_id: userId }),
  })

  return {
    basic_details: {
      ...createdProfile,
      full_name: createdProfile.full_name ?? input.full_name,
      headline: createdProfile.headline ?? input.headline,
    },
    degrees: [],
    work_experiences: [],
    skills: [],
    projects: [],
    languages: [],
    hobbies: [],
  }
}


export async function updateBasicDetails(profileId: number, basicDetails: BasicDetails): Promise<void> {
    const baseUrl = getApiBaseUrl()
    const profilePath = `/profiles/${profileId}`
    
    await requestJson(baseUrl, profilePath, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(basicDetails),
    })
}


async function createOrUpdateResource<TResponse>(
  createPath: string,
  updatePath: string,
  id: number,
  body: object,
): Promise<TResponse> {
  const isUpdate = id > 0
  const path = isUpdate ? updatePath : createPath
  return requestJson<TResponse>(getApiBaseUrl(), path, {
    method: isUpdate ? 'PATCH' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// For DELETE requests, we don't expect a JSON response, so we have a separate helper that just checks for success and throws an error if not.
async function requestNoContent(baseUrl: string, path: string, init: RequestInit): Promise<void> {
  const response = await fetch(`${baseUrl}${path}`, {
    cache: 'no-store',
    ...init,
  })
  if (!response.ok) {
    throw new ApiError(
      `${init.method ?? 'GET'} ${path} failed: ${response.status} ${response.statusText}`,
      response.status,
    )
  }
}

export async function createOrUpdateDegree(profileId: number, degree: Degree): Promise<Degree> {
  const { id, profile_id, ...body } = degree
  const savedDegree = await createOrUpdateResource<ApiDegree>(
    `/profiles/${profileId}/degrees`,
    `/degrees/${id}`,
    id,
    body,
  )
  const { degree_id, ...savedFields } = savedDegree
  return { ...savedFields, id: degree_id }
}


export async function deleteDegree(degreeId: number): Promise<void> {
    const baseUrl = getApiBaseUrl()
    
    await requestNoContent(baseUrl, `/degrees/${degreeId}`, {
        method: 'DELETE',
    })
}


export async function createOrUpdateWorkExperience(
  profileId: number,
  workExperience: WorkExperience,
): Promise<WorkExperience> {
  const { id, profile_id, ...body } = workExperience
  const savedExperience = await createOrUpdateResource<ApiWorkExperience>(
    `/profiles/${profileId}/work_experiences`,
    `/work_experiences/${id}`,
    id,
    body,
  )
  const { work_experience_id, ...savedFields } = savedExperience
  return { ...savedFields, id: work_experience_id }
}

export async function deleteWorkExperience(workExperienceId: number): Promise<void> {
    const baseUrl = getApiBaseUrl()

    await requestNoContent(baseUrl, `/work_experiences/${workExperienceId}`, {
        method: 'DELETE',
    })
}   

export async function createOrUpdateSkill(profileId: number, skill: Skill): Promise<Skill> {
  const { id, profile_id, ...body } = skill
  const savedSkill = await createOrUpdateResource<ApiSkill>(
    `/profiles/${profileId}/skills`,
    `/skills/${id}`,
    id,
    body,
  )
  const { skill_id, ...savedFields } = savedSkill
  return { ...savedFields, id: skill_id }
}

export async function deleteSkill(skillId: number): Promise<void> {
  await requestNoContent(getApiBaseUrl(), `/skills/${skillId}`, {
    method: 'DELETE',
  })
}

export async function createOrUpdateProject(profileId: number, project: Project): Promise<Project> {
  const { id, profile_id, skill_ids, ...body } = project
  const savedProject = await createOrUpdateResource<ApiProject>(
    `/profiles/${profileId}/projects`,
    `/projects/${id}`,
    id,
    body,
  )
  const projectId = savedProject.project_id

  const existingSkills = id > 0
    ? await getJson<ApiProjectSkill[]>(getApiBaseUrl(), `/projects/${projectId}/skills`)
    : []
  const existingSkillIds = new Set(existingSkills.map(({ skill_id }) => skill_id))
  const desiredSkillIds = new Set(skill_ids)

  await Promise.all([
    ...skill_ids
      .filter((skillId) => !existingSkillIds.has(skillId))
      .map((skillId) =>
        requestJson<ApiProjectSkill>(
          getApiBaseUrl(),
          `/projects/${projectId}/skills/${skillId}`,
          { method: 'POST' },
        ),
      ),
    ...[...existingSkillIds]
      .filter((skillId) => !desiredSkillIds.has(skillId))
      .map((skillId) =>
        requestNoContent(getApiBaseUrl(), `/projects/${projectId}/skills/${skillId}`, {
          method: 'DELETE',
        }),
      ),
  ])

  const { project_id, ...savedFields } = savedProject
  return { ...savedFields, id: project_id, skill_ids }
}

export async function deleteProject(projectId: number): Promise<void> {
    const baseUrl = getApiBaseUrl()
    
    await requestNoContent(baseUrl, `/projects/${projectId}`, {
        method: 'DELETE',
    })
}

export async function createOrUpdateLanguage(profileId: number, language: Language): Promise<Language> {
  const { id, profile_id, ...body } = language
  const savedLanguage = await createOrUpdateResource<ApiLanguage>(
    `/profiles/${profileId}/languages`,
    `/languages/${id}`,
    id,
    body,
  )
  const { language_id, ...savedFields } = savedLanguage
  return { ...savedFields, id: language_id }
}

export async function deleteLanguage(languageId: number): Promise<void> {
    const baseUrl = getApiBaseUrl()
    
    await requestNoContent(baseUrl, `/languages/${languageId}`, {
        method: 'DELETE',
    })
}

export async function createOrUpdateHobby(profileId: number, hobby: Hobby): Promise<Hobby> {
  const { id, profile_id, ...body } = hobby
  const savedHobby = await createOrUpdateResource<ApiHobby>(
    `/profiles/${profileId}/hobbies`,
    `/hobbies/${id}`,
    id,
    body,
  )
  const { hobby_id, ...savedFields } = savedHobby
  return { ...savedFields, id: hobby_id }
}

export async function deleteHobby(hobbyId: number): Promise<void> {
    const baseUrl = getApiBaseUrl()
    
    await requestNoContent(baseUrl, `/hobbies/${hobbyId}`, {
        method: 'DELETE',
    })
}
