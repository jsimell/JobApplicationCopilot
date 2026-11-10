'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { BriefcaseBusiness, UserRound } from 'lucide-react'
import { cn } from '@/services/utils'
import { createCurrentCareerProfile, loadCurrentCareerProfile } from '@/services/career-profile-api'
import { BasicInfoSection } from './sections/basic-info-section'
import { DegreesSection } from './sections/degrees-section'
import { HobbiesSection } from './sections/hobbies-section'
import { LanguagesSection } from './sections/languages-section'
import { ProjectsSection } from './sections/projects-section'
import { SkillsSection } from './sections/skills-section'
import { WorkSection } from './sections/work-section'
import { Button, Field, TextArea, TextInput, orNull } from './ui'
import { SectionCard } from './section-card'
import type { CareerProfile, WorkExperience, Skill, Degree, Project, Language, Hobby } from './types'
import type { CreateProfileInput } from '@/services/career-profile-api'
import { 
  updateBasicDetails, 
  createOrUpdateDegree, 
  createOrUpdateWorkExperience,
  createOrUpdateSkill,
  createOrUpdateProject,
  createOrUpdateLanguage,
  createOrUpdateHobby,
  deleteSkill,
  deleteDegree,
  deleteWorkExperience,
  deleteProject,
  deleteLanguage,
  deleteHobby,
} from '@/services/career-profile-api'

const NAV = [
  { id: 'basic_details', label: 'Basics' },
  { id: 'degrees', label: 'Education' },
  { id: 'work_experiences', label: 'Experience' },
  { id: 'skills', label: 'Skills' },
  { id: 'projects', label: 'Projects' },
  { id: 'languages', label: 'Languages' },
  { id: 'hobbies', label: 'Hobbies' },
]

export function ProfilePanel() {
  const [profile, setProfile] = useState<CareerProfile | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [onboardingView, setOnboardingView] = useState<'welcome' | 'form'>('welcome')
  const [createInput, setCreateInput] = useState<CreateProfileInput>({
    full_name: '',
    headline: '',
    location: null,
    summary: null,
    career_goals_description: null,
  })
  const [isCreating, setIsCreating] = useState(false)
  const [creationError, setCreationError] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState('basic_details')
  const scrollRef = useRef<HTMLDivElement>(null)
  const profileId = profile?.basic_details.profile_id

  const set = <K extends keyof CareerProfile>(key: K) => (value: CareerProfile[K]) =>
    setProfile((p) => (p ? { ...p, [key]: value } : p))

  const setSkills = (skills: Skill[]) =>
    setProfile((p) => {
      if (!p) return p
      const ids = new Set(skills.map((s) => s.id))
      return {
        ...p,
        skills,
        projects: p.projects.map((proj) => ({ ...proj, skill_ids: proj.skill_ids.filter((id) => ids.has(id)) })),
      }
    })

  const skillUsage = useMemo(() => {
    const usage: Record<number, number> = {}
    for (const proj of profile?.projects ?? []) for (const id of proj.skill_ids) usage[id] = (usage[id] ?? 0) + 1
    return usage
  }, [profile?.projects])

  useEffect(() => {
    let cancelled = false
    setLoadError(null)
    loadCurrentCareerProfile().then(
      (loadedProfile) => {
        if (!cancelled) {
          setProfile(loadedProfile)
          setProfileLoaded(true)
        }
      },
      (error: unknown) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'Could not load your career profile.')
        }
      },
    )
    return () => {
      cancelled = true
    }
  }, [loadAttempt])

  const submitInitialProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCreationError(null)
    if (!createInput.full_name.trim() || !createInput.headline.trim()) {
      setCreationError('Please enter your full name and headline.')
      return
    }
    setIsCreating(true)
    try {
      const createdProfile = await createCurrentCareerProfile({
        ...createInput,
        full_name: createInput.full_name.trim(),
        headline: createInput.headline.trim(),
      })
      setProfile(createdProfile)
    } catch (error) {
      setCreationError(error instanceof Error ? error.message : 'Could not create your profile.')
    } finally {
      setIsCreating(false)
    }
  }

  useEffect(() => {
    const root = scrollRef.current
    if (!root || !profile) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveSection(visible[0].target.id.replace('section-', ''))
      },
      { root, rootMargin: '0px 0px -65% 0px' },
    )
    NAV.forEach((n) => {
      const el = document.getElementById(`section-${n.id}`)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [profile])

  
  const saveBasicInfo = async (basicDetails: CareerProfile['basic_details']) => {
    const profileId = profile?.basic_details.profile_id
    if (profileId === undefined) {
        throw new Error('Cannot save basic information before the profile is loaded.')
    }

    await updateBasicDetails(profileId, basicDetails)
    setProfile((current) =>
        current ? { ...current, basic_details: basicDetails } : current,
    )
  }


  const saveDegree = async (degree: Degree): Promise<Degree> => {
    const profileId = profile?.basic_details.profile_id
    if (profileId === undefined) {
      throw new Error('Cannot save a degree before the profile is loaded.')
    }

    return createOrUpdateDegree(profileId, degree)
  }

  const saveSkills = async (skill: Skill): Promise<Skill> => {
    const profileId = profile?.basic_details.profile_id
    if (profileId === undefined) {
      throw new Error('Cannot save a skill before the profile is loaded.')
    }

    return createOrUpdateSkill(profileId, skill)
  }

  // For testing. Remove this function when the backend supports saving for all sections.
  const notImplementedSave = async <T,>(_item: T): Promise<T> => {
    throw new Error('Saving this section is not implemented yet.')
  }

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto bg-background">
      {!profile && (
        <div
          className="mx-auto flex max-w-2xl flex-col items-center gap-3 px-6 py-12 text-center sm:py-16"
          role={loadError ? 'alert' : undefined}
          aria-live={loadError ? undefined : 'polite'}
        >
          {loadError ? (
            <>
              <p className="text-sm text-destructive">{loadError}</p>
              <Button
                size="sm"
                onClick={() => {
                  setProfileLoaded(false)
                  setLoadAttempt((attempt) => attempt + 1)
                }}
              >
                Retry
              </Button>
            </>
          ) : !profileLoaded ? (
            <p className="text-sm text-muted-foreground">Loading your career profile…</p>
          ) : onboardingView === 'welcome' ? (
            <>
              <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
                <BriefcaseBusiness className="size-5" aria-hidden="true" />
              </div>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-primary">Build your career profile</h1>
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                Keep your professional background, experiences, skills, interests, working style, and career goals in one
                place. Add thorough descriptions of your experience and projects, along with thoughtful summaries and
                goals. The AI Assistant will use this information to select relevant details for job applications and
                job advertisements. The more comprehensive your profile, the better it can understand your background
                and make relevant recommendations.
              </p>
              <Button
                variant="primary"
                className="mt-3"
                onClick={() => setOnboardingView('form')}
              >
                Create Profile
              </Button>
            </>
          ) : (
            <div className="w-full max-w-3xl text-left">
              <SectionCard
                id="initial-profile"
                icon={UserRound}
                title="Create your profile"
                description="Start with the basic information that introduces you professionally."
              >
                <form onSubmit={submitInitialProfile}>
                  <fieldset disabled={isCreating} className="grid gap-4 sm:grid-cols-2">
                    <Field label="Full name" htmlFor="initial-profile-full-name" required>
                      <TextInput
                        id="initial-profile-full-name"
                        autoComplete="name"
                        aria-required="true"
                        required
                        value={createInput.full_name}
                        onChange={(event) => setCreateInput((current) => ({ ...current, full_name: event.target.value }))}
                      />
                    </Field>
                    <Field label="Location" htmlFor="initial-profile-location">
                      <TextInput
                        id="initial-profile-location"
                        autoComplete="address-level2"
                        placeholder="City, Country"
                        value={createInput.location ?? ''}
                        onChange={(event) =>
                          setCreateInput((current) => ({ ...current, location: orNull(event.target.value) }))
                        }
                      />
                    </Field>
                    <Field label="Headline" htmlFor="initial-profile-headline" className="sm:col-span-2" required>
                      <TextInput
                        id="initial-profile-headline"
                        aria-required="true"
                        required
                        placeholder="e.g. Senior Product Designer · Fintech"
                        value={createInput.headline}
                        onChange={(event) => setCreateInput((current) => ({ ...current, headline: event.target.value }))}
                      />
                    </Field>
                    <Field label="Summary" htmlFor="initial-profile-summary" className="sm:col-span-2">
                      <TextArea
                        id="initial-profile-summary"
                        rows={4}
                        value={createInput.summary ?? ''}
                        onChange={(event) =>
                          setCreateInput((current) => ({ ...current, summary: orNull(event.target.value) }))
                        }
                      />
                    </Field>
                    <Field
                      label="Career goals"
                      htmlFor="initial-profile-career-goals"
                      hint="Describe what you want to focus on in your next career step."
                      className="sm:col-span-2"
                    >
                      <TextArea
                        id="initial-profile-career-goals"
                        rows={4}
                        value={createInput.career_goals_description ?? ''}
                        onChange={(event) =>
                          setCreateInput((current) => ({
                            ...current,
                            career_goals_description: orNull(event.target.value),
                          }))
                        }
                      />
                    </Field>
                  </fieldset>
                  {creationError && (
                    <p className="mt-4 rounded-md bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
                      {creationError}
                    </p>
                  )}
                  <div className="mt-5 flex flex-wrap justify-end gap-2">
                    <Button disabled={isCreating} onClick={() => setOnboardingView('welcome')}>
                      Back
                    </Button>
                    <Button variant="primary" type="submit" loading={isCreating}>
                      Create Profile
                    </Button>
                  </div>
                </form>
              </SectionCard>
            </div>
          )}
        </div>
      )}
      {profile && profileId !== undefined && (
        <>
      <nav
        aria-label="Profile sections"
        className="sticky top-0 z-10 border-b bg-background/90 px-4 py-2.5 backdrop-blur sm:px-6"
      >
        <ul className="flex gap-1 overflow-x-auto scrollbar-none justify-center">
          {NAV.map((n) => (
            <li key={n.id}>
              <a
                href={`#section-${n.id}`}
                aria-current={activeSection === n.id ? 'true' : undefined}
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById(`section-${n.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                className={cn(
                  'inline-flex h-7 items-center whitespace-nowrap rounded-full px-3 text-xs font-medium transition-colors',
                  activeSection === n.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-card hover:text-foreground',
                )}
              >
                {n.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6 sm:px-6">
        <BasicInfoSection value={profile.basic_details} onChange={saveBasicInfo} />
        <DegreesSection
          profileId={profileId}
          items={profile.degrees}
          onChange={set('degrees')}
          onSave={saveDegree}
          onDelete={(degreeId) => deleteDegree(degreeId)}
        />
        <WorkSection profileId={profileId} items={profile.work_experiences} onChange={set('work_experiences')} onSave={notImplementedSave} />
        <SkillsSection
          profileId={profileId}
          skills={profile.skills}
          onChange={setSkills}
          onSave={saveSkills}
          onDelete={(skill) => deleteSkill(skill.id)}
          usage={skillUsage}
        />
        <ProjectsSection profileId={profileId} items={profile.projects} onChange={set('projects')} onSave={notImplementedSave} skills={profile.skills} />
        <LanguagesSection profileId={profileId} items={profile.languages} onChange={set('languages')} onSave={notImplementedSave} />
        <HobbiesSection profileId={profileId} items={profile.hobbies} onChange={set('hobbies')} onSave={notImplementedSave} />
        <p className="pb-6 pt-2 text-center text-xs text-muted-foreground">
          Prototype — your profile is loaded from the backend.
        </p>
      </div>
        </>
      )}
    </div>
  )
}
