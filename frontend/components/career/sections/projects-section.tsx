'use client'

import { ExternalLink, FolderKanban } from 'lucide-react'
import { cn } from '@/services/utils'
import { EntryList } from '../entry-editor'
import { SectionCard } from '../section-card'
import { SkillMultiSelect } from '../skill-multi-select'
import type { Project, Skill } from '../types'
import { Field, MonthYearInput, Select, TextArea, TextInput, chipColor, formatMonth, newTempId, orNull } from '../ui'

export function ProjectsSection({
  profileId,
  items,
  onChange,
  onSave,
  onDelete,
  skills,
}: {
  profileId: number
  items: Project[]
  onChange: (v: Project[]) => void
  onSave: (project: Project) => Promise<Project>
  onDelete: (projectId: number) => Promise<void>
  skills: Skill[]
}) {
  const skillById = new Map(skills.map((s) => [s.id, s]))

  return (
    <SectionCard
      id="projects"
      icon={FolderKanban}
      title="Projects"
      description="Side projects, open source, and notable work initiatives."
    >
      <EntryList
        sectionKey="projects"
        items={items}
        onChange={onChange}
        onSaveEntry={onSave}
        onDeleteEntry={(project) => onDelete(project.id)}
        noun="project"
        createEmpty={() => ({
          id: newTempId(),
          profile_id: profileId,
          title: '',
          subtitle: null,
          project_date: null,
          status: 'completed' as const,
          description: null,
          url: null,
          skill_ids: [],
        })}
        validate={(v) => {
          if (!v.title.trim()) return 'Please add a project title.'
          if (v.url && !/^https?:\/\/\S+\.\S+/.test(v.url)) return 'The URL should start with http:// or https://'
          return null
        }}
        renderSummary={(p) => {
          const linked = p.skill_ids.map((id) => skillById.get(id)).filter((s): s is Skill => !!s)
          return (
            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <p className="font-medium text-foreground">{p.title}</p>
                <p className="text-xs tabular-nums text-muted-foreground">
                  {p.project_date
                    ? `${formatMonth(p.project_date)} · ${p.status === 'ongoing' ? 'Ongoing' : 'Completed'}`
                    : p.status === 'ongoing'
                      ? 'Ongoing'
                      : 'Completed'}
                </p>
              </div>
              {p.subtitle && <p className="text-sm text-muted-foreground">{p.subtitle}</p>}
              {p.description && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-foreground/75">{p.description}</p>}
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                {linked.map((s) => (
                  <span key={s.id} className={cn('rounded-full border px-2 py-0.5 text-xs font-medium', chipColor(s.name))}>
                    {s.name}
                  </span>
                ))}
                {p.url && (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    <ExternalLink className="size-3" aria-hidden="true" />
                    {p.url.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>
            </div>
          )
        }}
        renderForm={(d, update) => {
          const fid = (field: string) => `project-${d.id}-${field}`
          return (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title" htmlFor={fid('title')} required>
                <TextInput id={fid('title')} aria-required="true" value={d.title} onChange={(e) => update({ title: e.target.value })} />
              </Field>
              <Field label="Subtitle" htmlFor={fid('subtitle')}>
                <TextInput
                  id={fid('subtitle')}
                  value={d.subtitle ?? ''}
                  placeholder="A short tagline"
                  onChange={(e) => update({ subtitle: orNull(e.target.value) })}
                />
              </Field>
              <Field label="Status" htmlFor={fid('status')}>
                <Select
                  id={fid('status')}
                  value={d.status}
                  onChange={(e) => {
                    if (e.target.value === 'ongoing' || e.target.value === 'completed') {
                      update({ status: e.target.value })
                    }
                  }}
                >
                  <option value="completed">Completed</option>
                  <option value="ongoing">Ongoing</option>
                </Select>
              </Field>
              <Field label={d.status === 'ongoing' ? 'Start date' : 'Completion date'} htmlFor={fid('project_date')}>
                <MonthYearInput
                  id={fid('project_date')}
                  ariaLabel={d.status === 'ongoing' ? 'Start date' : 'Completion date'}
                  value={d.project_date}
                  onChange={(project_date) => update({ project_date })}
                />
              </Field>
              <Field label="Description" htmlFor={fid('description')} className="sm:col-span-2">
                <TextArea
                  id={fid('description')}
                  rows={4}
                  value={d.description ?? ''}
                  onChange={(e) => update({ description: orNull(e.target.value) })}
                />
              </Field>
              <Field label="URL" htmlFor={fid('url')} className="sm:col-span-2">
                <TextInput
                  id={fid('url')}
                  type="url"
                  value={d.url ?? ''}
                  placeholder="https://"
                  onChange={(e) => update({ url: orNull(e.target.value) })}
                />
              </Field>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <span id={fid('skills-label')} className="text-xs font-medium text-foreground/80">
                  Associated skills
                </span>
                <SkillMultiSelect
                  skills={skills}
                  value={d.skill_ids}
                  onChange={(skill_ids) => update({ skill_ids })}
                  labelledBy={fid('skills-label')}
                />
                <p className="text-xs text-muted-foreground">Choose from the skills in your profile.</p>
              </div>
            </div>
          )
        }}
      />
    </SectionCard>
  )
}
