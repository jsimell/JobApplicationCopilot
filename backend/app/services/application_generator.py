import json
from pathlib import Path

from app.services.llm.openai_provider import generate_text


GENERATE_PLAN_PROMPT_PATH = (
    Path(__file__).resolve().parent.parent
    / "prompts"
    / "plan_instructions.md"
)

WRITE_APPLICATION_PROMPT_PATH = (
    Path(__file__).resolve().parent.parent
    / "prompts"
    / "application_generation_instructions.md"
)


# Generates a plan for what to emphasize in the application to guide the actual application generation process
def generate_plan(job_ad: str, career_profile: dict, user_guidance: str | None = None) -> str:
    instructions = GENERATE_PLAN_PROMPT_PATH.read_text(encoding="utf-8")

    user_input = json.dumps({
        "job_advertisement": job_ad,
        "career_profile": career_profile,
        "user_guidance": user_guidance,
    }, ensure_ascii=False)

    return generate_text(instructions, user_input)


# Generates a job application based on a given job ad, career profile data, and a plan for the application contents
def generate_job_application(job_ad: str, career_profile: dict, plan: str) -> str:
    instructions = WRITE_APPLICATION_PROMPT_PATH.read_text(encoding="utf-8")

    user_input = json.dumps({
        "job_ad": job_ad,
        "career_profile": career_profile,
        "application_plan": plan,
    }, ensure_ascii=False)

    return generate_text(instructions, user_input)
