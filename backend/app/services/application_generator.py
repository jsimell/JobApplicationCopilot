import json

from app.services.llm.openai_provider import generate_text

from pathlib import Path

PROMPT_PATH = (
    Path(__file__).resolve().parent.parent
    / "prompts"
    / "application_generation_instructions.md"
)

TASK_INSTRUCTIONS = PROMPT_PATH.read_text(encoding="utf-8")


def generate_job_application(
    job_ad: str,
    career_profile: dict,
) -> str:

    user_input = json.dumps({
        "job_advertisement": job_ad,
        "career_profile": career_profile,
    }, ensure_ascii=False)

    return generate_text(TASK_INSTRUCTIONS, user_input)
