/** SQL `date`, serialized as an ISO "YYYY-MM-DD" string. */
export type DateValue = string

/** Basic information stored in the `profiles` table. */
export interface BasicDetails {
  profile_id: number
  user_id: string
  full_name: string
  headline: string
  location: string | null
  summary: string | null
  career_goals_description: string | null
}

/** `skills` table. */
export interface Skill {
  id: number
  profile_id: number
  name: string
  proficiency: string | null
}

/**
 * `projects` table. `skill_ids` represents the project's rows in the
 * `project_skills` join table; the backend persists them there.
 */
export interface Project {
  id: number
  profile_id: number
  title: string
  subtitle: string | null
  start_date: DateValue | null
  end_date: DateValue | null
  description: string | null
  url: string | null
  skill_ids: number[]
}

/** `work_experiences` table. */
export interface WorkExperience {
  id: number
  profile_id: number
  title: string
  company: string
  location: string | null
  start_date: DateValue | null
  end_date: DateValue | null
  description: string | null
}

/** `languages` table. */
export interface Language {
  id: number
  profile_id: number
  language: string
  proficiency: string
}

/** `degrees` table. */
export interface Degree {
  id: number
  profile_id: number
  title: string
  school: string
  location: string | null
  finished_date: DateValue | null
  gpa: number | null
  major: string | null
  minor: string | null
  additional_information: string | null
}

/** `hobbies` table. */
export interface Hobby {
  id: number
  profile_id: number
  name: string
  description: string | null
}

export interface CareerProfile {
  basic_details: BasicDetails
  degrees: Degree[]
  work_experiences: WorkExperience[]
  skills: Skill[]
  projects: Project[]
  languages: Language[]
  hobbies: Hobby[]
}

/** Suggested values for `skills.proficiency` (the column itself is free text). */
export const SKILL_PROFICIENCIES = ['Beginner', 'Intermediate', 'Advanced', 'Expert'] as const

/** Suggested values for `languages.proficiency` (the column itself is free text). */
export const LANGUAGE_PROFICIENCIES = [
  'Elementary (A2)',
  'Intermediate (B1)',
  'Upper intermediate (B2)',
  'Advanced (C1)',
  'Proficient (C2)',
  'Native',
] as const
