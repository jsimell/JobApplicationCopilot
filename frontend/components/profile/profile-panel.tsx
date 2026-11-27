"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { ReactNode } from "react";
import { BriefcaseBusiness, ChevronUp, Menu, UserRound } from "lucide-react";
import { cn } from "@/services/utils";
import {
  createCurrentCareerProfile,
  loadCurrentCareerProfile,
} from "@/services/career-profile-api";
import { BasicInfoSection } from "./sections/basic-info-section";
import { DegreesSection } from "./sections/degrees-section";
import { HobbiesSection } from "./sections/hobbies-section";
import { LanguagesSection } from "./sections/languages-section";
import { ProjectsSection } from "./sections/projects-section";
import { SkillsSection } from "./sections/skills-section";
import { WorkSection } from "./sections/work-section";
import { Button, Field, TextArea, TextInput, orNull } from "./ui";
import { SectionCard } from "./section-card";
import type {
  CareerProfile,
  WorkExperience,
  Skill,
  Degree,
  Project,
  Language,
  Hobby,
} from "../shared/types";
import type { CreateProfileInput } from "@/services/career-profile-api";
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
} from "@/services/career-profile-api";

const NAV = [
  { id: "basic_details", label: "Basics" },
  { id: "degrees", label: "Education" },
  { id: "work_experiences", label: "Experience" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "languages", label: "Languages" },
  { id: "hobbies", label: "Hobbies" },
];
const ACTIVE_SECTION_VISIBILITY_THRESHOLD = 0.5;
const PROFILE_SECTION_GAP = 20;

export function ProfilePanel({
  sidebarNavigation,
  onFullNameChange,
}: {
  sidebarNavigation: ReactNode
  onFullNameChange: (fullName: string | null) => void
}) {
  const [profile, setProfile] = useState<CareerProfile | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [onboardingView, setOnboardingView] = useState<"welcome" | "form">("welcome");
  const [createInput, setCreateInput] = useState<CreateProfileInput>({
    full_name: "",
    headline: "",
    location: null,
    summary: null,
    career_goals_description: null,
  });
  const [isCreating, setIsCreating] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("basic_details");
  const [mobileSectionsOpen, setMobileSectionsOpen] = useState(false);
  const [mobileSectionsVisible, setMobileSectionsVisible] = useState(true);
  const [pendingSectionNavigation, setPendingSectionNavigation] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastScrollTopRef = useRef(0);
  const scrollDirectionRef = useRef(0);
  const scrollDistanceRef = useRef(0);
  const sectionNavigationScrollRef = useRef(false);
  const sectionNavigationScrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const profileId = profile?.basic_details.profile_id;

  const set =
    <K extends keyof CareerProfile>(key: K) =>
    (value: CareerProfile[K]) =>
      setProfile((p) => (p ? { ...p, [key]: value } : p));

  const setSkills = (skills: Skill[]) =>
    setProfile((p) => {
      if (!p) return p;
      const ids = new Set(skills.map((s) => s.id));
      return {
        ...p,
        skills,
        projects: p.projects.map((proj) => ({
          ...proj,
          skill_ids: proj.skill_ids.filter((id) => ids.has(id)),
        })),
      };
    });

  const skillUsage = useMemo(() => {
    const usage: Record<number, number> = {};
    for (const proj of profile?.projects ?? [])
      for (const id of proj.skill_ids) usage[id] = (usage[id] ?? 0) + 1;
    return usage;
  }, [profile?.projects]);

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    loadCurrentCareerProfile().then(
      (loadedProfile) => {
        if (!cancelled) {
          setProfile(loadedProfile);
          onFullNameChange(loadedProfile?.basic_details.full_name.trim() || null);
          setProfileLoaded(true);
        }
      },
      (error: unknown) => {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Could not load your career profile.",
          );
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [loadAttempt, onFullNameChange]);

  const submitInitialProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreationError(null);
    if (!createInput.full_name.trim() || !createInput.headline.trim()) {
      setCreationError("Please enter your full name and headline.");
      return;
    }
    setIsCreating(true);
    try {
      const createdProfile = await createCurrentCareerProfile({
        ...createInput,
        full_name: createInput.full_name.trim(),
        headline: createInput.headline.trim(),
      });
      setProfile(createdProfile);
      onFullNameChange(createdProfile.basic_details.full_name.trim() || null);
    } catch (error) {
      setCreationError(
        error instanceof Error ? error.message : "Could not create your profile.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    const root = scrollRef.current;
    if (!root || !profile) return;

    lastScrollTopRef.current = root.scrollTop;
    const finishSectionNavigationScroll = () => {
      sectionNavigationScrollRef.current = false;
      if (sectionNavigationScrollTimerRef.current) {
        clearTimeout(sectionNavigationScrollTimerRef.current);
        sectionNavigationScrollTimerRef.current = null;
      }
    };
    const handleScroll = () => {
      const currentTop = root.scrollTop;
      const delta = currentTop - lastScrollTopRef.current;
      lastScrollTopRef.current = currentTop;
      const direction = Math.sign(delta);

      if (sectionNavigationScrollRef.current) {
        setMobileSectionsVisible(false);
        if (sectionNavigationScrollTimerRef.current) {
          clearTimeout(sectionNavigationScrollTimerRef.current);
        }
        sectionNavigationScrollTimerRef.current = setTimeout(
          finishSectionNavigationScroll,
          150,
        );
        return;
      }

      if (currentTop <= 8) {
        scrollDirectionRef.current = 0;
        scrollDistanceRef.current = 0;
        setActiveSection(NAV[0].id);
        setMobileSectionsVisible(true);
        return;
      }

      const rootBounds = root.getBoundingClientRect();
      const visibleSections = NAV.map((section) => ({
        id: section.id,
        element: document.getElementById(`section-${section.id}`),
      }))
        .map(({ id, element }) => {
          const bounds = element?.getBoundingClientRect();
          const visibleHeight = bounds
            ? Math.max(0, Math.min(bounds.bottom, rootBounds.bottom) - Math.max(bounds.top, rootBounds.top))
            : 0;
          return {
            id,
            bounds,
            visibility: bounds && bounds.height > 0 ? visibleHeight / bounds.height : 0,
          };
        })
        .filter(
          (section): section is { id: string; bounds: DOMRect; visibility: number } => {
            const bounds = section.bounds;
            return Boolean(
              bounds && bounds.bottom > rootBounds.top && bounds.top < rootBounds.bottom,
            );
          },
        );

      if (direction > 0) {
        const thresholdSection = visibleSections
          .filter((section) => section.visibility >= ACTIVE_SECTION_VISIBILITY_THRESHOLD)
          .at(-1);
        if (thresholdSection) setActiveSection(thresholdSection.id);
      } else if (direction < 0) {
        const activeIndex = NAV.findIndex((section) => section.id === activeSection);
        const activeCard = visibleSections.find((section) => section.id === activeSection);
        if (
          activeIndex > 0 &&
          (!activeCard || activeCard.visibility < ACTIVE_SECTION_VISIBILITY_THRESHOLD)
        ) {
          setActiveSection(NAV[activeIndex - 1].id);
        }
      }

      if (direction === 0) return;
      if (direction !== scrollDirectionRef.current) {
        scrollDirectionRef.current = direction;
        scrollDistanceRef.current = 0;
      }
      scrollDistanceRef.current += Math.abs(delta);
      if (scrollDistanceRef.current < 10) return;

      setMobileSectionsVisible(direction < 0);
      if (direction > 0) setMobileSectionsOpen(false);
      scrollDistanceRef.current = 0;
    };

    root.addEventListener("scroll", handleScroll, { passive: true });
    root.addEventListener("scrollend", finishSectionNavigationScroll);
    return () => {
      root.removeEventListener("scroll", handleScroll);
      root.removeEventListener("scrollend", finishSectionNavigationScroll);
      finishSectionNavigationScroll();
    };
  }, [activeSection, profile]);

  useEffect(() => {
    if (!pendingSectionNavigation) return;
    const root = scrollRef.current;
    const section = document.getElementById(`section-${pendingSectionNavigation}`);
    if (!root || !section) return;

    const rootTop = root.getBoundingClientRect().top;
    const sectionTop = section.getBoundingClientRect().top;
    const targetScrollTop = Math.max(
      0,
      root.scrollTop + sectionTop - rootTop - PROFILE_SECTION_GAP,
    );
    if (Math.abs(targetScrollTop - root.scrollTop) <= 1) {
      sectionNavigationScrollRef.current = false;
    }
    root.scrollTo({
      top: targetScrollTop,
      behavior: "smooth",
    });
    setActiveSection(pendingSectionNavigation);
    setPendingSectionNavigation(null);
  }, [pendingSectionNavigation]);

  const saveBasicInfo = async (basicDetails: CareerProfile["basic_details"]) => {
    const profileId = profile?.basic_details.profile_id;
    if (profileId === undefined) {
      throw new Error("Cannot save basic information before the profile is loaded.");
    }

    await updateBasicDetails(profileId, basicDetails);
    onFullNameChange(basicDetails.full_name.trim() || null);
    setProfile((current) =>
      current ? { ...current, basic_details: basicDetails } : current,
    );
  };

  const saveDegree = async (degree: Degree): Promise<Degree> => {
    const profileId = profile?.basic_details.profile_id;
    if (profileId === undefined) {
      throw new Error("Cannot save a degree before the profile is loaded.");
    }

    return createOrUpdateDegree(profileId, degree);
  };

  const saveWorkExperience = async (
    workExperience: WorkExperience,
  ): Promise<WorkExperience> => {
    const profileId = profile?.basic_details.profile_id;
    if (profileId === undefined) {
      throw new Error("Cannot save a work experience before the profile is loaded.");
    }

    return createOrUpdateWorkExperience(profileId, workExperience);
  };

  const saveProject = async (project: Project): Promise<Project> => {
    const profileId = profile?.basic_details.profile_id;
    if (profileId === undefined) {
      throw new Error("Cannot save a project before the profile is loaded.");
    }

    return createOrUpdateProject(profileId, project);
  };

  const saveLanguage = async (language: Language): Promise<Language> => {
    const profileId = profile?.basic_details.profile_id;
    if (profileId === undefined) {
      throw new Error("Cannot save a language before the profile is loaded.");
    }

    return createOrUpdateLanguage(profileId, language);
  };

  const saveHobby = async (hobby: Hobby): Promise<Hobby> => {
    const profileId = profile?.basic_details.profile_id;
    if (profileId === undefined) {
      throw new Error("Cannot save a hobby before the profile is loaded.");
    }

    return createOrUpdateHobby(profileId, hobby);
  };

  const saveSkills = async (skill: Skill): Promise<Skill> => {
    const profileId = profile?.basic_details.profile_id;
    if (profileId === undefined) {
      throw new Error("Cannot save a skill before the profile is loaded.");
    }

    return createOrUpdateSkill(profileId, skill);
  };

  // For testing. Remove this function when the backend supports saving for all sections.
  const notImplementedSave = async <T,>(_item: T): Promise<T> => {
    throw new Error("Saving this section is not implemented yet.");
  };

  return (
    <div className="h-full min-h-0 overflow-hidden bg-canvas">
      {!profile && (
        <div className="flex h-full min-h-0 flex-col md:flex-row">
          <aside className="shrink-0 border-b bg-background p-2 md:flex-[0_0_20rem] md:border-b-0 md:border-r">
            {sidebarNavigation}
          </aside>
          <div
            className="min-h-0 flex-1 overflow-y-auto px-6 py-12 sm:py-16"
            role={loadError ? "alert" : undefined}
            aria-live={loadError ? undefined : "polite"}
          >
            <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
            {loadError ? (
              <>
                <p className="text-sm text-destructive">{loadError}</p>
                <Button
                  size="sm"
                  onClick={() => {
                    setProfileLoaded(false);
                    setLoadAttempt((attempt) => attempt + 1);
                  }}
                >
                  Retry
                </Button>
              </>
            ) : !profileLoaded ? (
              <p className="text-sm text-muted-foreground">Loading your career profile…</p>
            ) : onboardingView === "welcome" ? (
              <>
                <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
                  <BriefcaseBusiness className="size-5" aria-hidden="true" />
                </div>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-primary">
                  Build your career profile
                </h1>
                <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                  Keep your professional background, experiences, skills, interests, working
                  style, and career goals in one place. Add thorough descriptions of your
                  experience and projects, along with thoughtful summaries and goals. The AI
                  Assistant will use this information to select relevant details for job
                  applications and job advertisements. The more comprehensive your profile,
                  the better it can understand your background and make relevant
                  recommendations.
                </p>
                <Button
                  variant="primary"
                  className="mt-3"
                  onClick={() => setOnboardingView("form")}
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
                          onChange={(event) =>
                            setCreateInput((current) => ({
                              ...current,
                              full_name: event.target.value,
                            }))
                          }
                        />
                      </Field>
                      <Field label="Location" htmlFor="initial-profile-location">
                        <TextInput
                          id="initial-profile-location"
                          autoComplete="address-level2"
                          placeholder="City, Country"
                          value={createInput.location ?? ""}
                          onChange={(event) =>
                            setCreateInput((current) => ({
                              ...current,
                              location: orNull(event.target.value),
                            }))
                          }
                        />
                      </Field>
                      <Field
                        label="Headline"
                        htmlFor="initial-profile-headline"
                        className="sm:col-span-2"
                        required
                      >
                        <TextInput
                          id="initial-profile-headline"
                          aria-required="true"
                          required
                          placeholder="e.g. Senior Product Designer · Fintech"
                          value={createInput.headline}
                          onChange={(event) =>
                            setCreateInput((current) => ({
                              ...current,
                              headline: event.target.value,
                            }))
                          }
                        />
                      </Field>
                      <Field
                        label="Summary"
                        htmlFor="initial-profile-summary"
                        className="sm:col-span-2"
                      >
                        <TextArea
                          id="initial-profile-summary"
                          autoResize
                          rows={4}
                          value={createInput.summary ?? ""}
                          onChange={(event) =>
                            setCreateInput((current) => ({
                              ...current,
                              summary: orNull(event.target.value),
                            }))
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
                          autoResize
                          rows={4}
                          value={createInput.career_goals_description ?? ""}
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
                      <p
                        className="mt-4 rounded-md bg-destructive/5 px-3 py-2 text-sm text-destructive"
                        role="alert"
                      >
                        {creationError}
                      </p>
                    )}
                    <div className="mt-5 flex flex-wrap justify-end gap-2">
                      <Button
                        disabled={isCreating}
                        onClick={() => setOnboardingView("welcome")}
                      >
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
          </div>
        </div>
      )}
      {profile && profileId !== undefined && (
        <div className="flex h-full min-h-0 flex-col md:flex-row">
          <aside className="shrink-0 border-b bg-background md:flex-[0_0_20rem] md:border-b-0 md:border-r">
            <div className="border-b p-2">{sidebarNavigation}</div>
            <div className="relative h-11 md:hidden">
              <div
                aria-hidden={!mobileSectionsVisible}
                inert={!mobileSectionsVisible}
                className={cn(
                  "absolute inset-x-0 top-0 z-20 bg-background transition-[opacity,transform] duration-300 ease-in-out motion-reduce:transition-none",
                  mobileSectionsVisible
                    ? "translate-y-0 opacity-100"
                    : "pointer-events-none -translate-y-full opacity-0",
                )}
              >
                <button
                  type="button"
                  aria-expanded={mobileSectionsOpen}
                  aria-controls="mobile-profile-navigation"
                  onClick={() => setMobileSectionsOpen((open) => !open)}
                  tabIndex={mobileSectionsVisible ? 0 : -1}
                  className="flex h-11 w-full items-center justify-between border-b px-4 text-sm font-medium text-foreground"
                >
                  <span>Profile navigation</span>
                  {mobileSectionsOpen ? (
                    <ChevronUp className="size-4 text-muted-foreground" aria-hidden="true" />
                  ) : (
                    <Menu className="size-4 text-muted-foreground" aria-hidden="true" />
                  )}
                </button>
                {mobileSectionsOpen && (
                  <nav
                    id="mobile-profile-navigation"
                    aria-label="Profile navigation"
                    className="border-b bg-background px-3 py-2 shadow-md"
                  >
                    <ul className="flex flex-col gap-1">
                      {NAV.map((section) => (
                        <li key={section.id}>
                          <a
                            href={`#section-${section.id}`}
                            aria-current={activeSection === section.id ? "true" : undefined}
                            tabIndex={mobileSectionsVisible ? 0 : -1}
                            onClick={(event) => {
                              event.preventDefault();
                              setMobileSectionsOpen(false);
                              setMobileSectionsVisible(false);
                              sectionNavigationScrollRef.current = true;
                              setPendingSectionNavigation(section.id);
                            }}
                            className={cn(
                              "flex h-10 w-full items-center rounded-md px-3 text-sm font-medium",
                              activeSection === section.id
                                ? "bg-secondary text-primary"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground",
                            )}
                          >
                            {section.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                )}
              </div>
            </div>
            <nav
              aria-label="Profile navigation"
              className="z-10 hidden px-3 py-5 md:block"
            >
              <ul className="flex flex-col gap-1">
                {NAV.map((n) => (
                  <li key={n.id}>
                    <a
                      href={`#section-${n.id}`}
                      aria-current={activeSection === n.id ? "true" : undefined}
                      onClick={(e) => {
                        e.preventDefault();
                        setPendingSectionNavigation(n.id);
                      }}
                      className={cn(
                        "inline-flex h-9 w-full min-w-0 items-center justify-start overflow-hidden rounded-md px-3 text-left text-sm font-medium transition-colors",
                        activeSection === n.id
                          ? "bg-secondary text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <span className="truncate">{n.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6 sm:py-6">
              <BasicInfoSection value={profile.basic_details} onChange={saveBasicInfo} />
              <DegreesSection
                profileId={profileId}
                items={profile.degrees}
                onChange={set("degrees")}
                onSave={saveDegree}
                onDelete={(degreeId) => deleteDegree(degreeId)}
              />
              <WorkSection
                profileId={profileId}
                items={profile.work_experiences}
                onChange={set("work_experiences")}
                onSave={saveWorkExperience}
                onDelete={(workExperienceId) => deleteWorkExperience(workExperienceId)}
              />
              <SkillsSection
                profileId={profileId}
                skills={profile.skills}
                onChange={setSkills}
                onSave={saveSkills}
                onDelete={(skill) => deleteSkill(skill.id)}
                usage={skillUsage}
              />
              <ProjectsSection
                profileId={profileId}
                items={profile.projects}
                onChange={set("projects")}
                onSave={saveProject}
                onDelete={(projectId) => deleteProject(projectId)}
                skills={profile.skills}
              />
              <LanguagesSection
                profileId={profileId}
                items={profile.languages}
                onChange={set("languages")}
                onSave={saveLanguage}
                onDelete={(languageId) => deleteLanguage(languageId)}
              />
              <HobbiesSection
                profileId={profileId}
                items={profile.hobbies}
                onChange={set("hobbies")}
                onSave={saveHobby}
                onDelete={(hobbyId) => deleteHobby(hobbyId)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
