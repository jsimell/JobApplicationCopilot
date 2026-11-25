import json
from pathlib import Path
from unittest.mock import Mock

from app.services import application_generator


def test_generate_plan_passes_prompt_and_matching_input_fields(monkeypatch):
    generate_text = Mock(return_value="Application plan")
    monkeypatch.setattr(application_generator, "generate_text", generate_text)

    result = application_generator.generate_plan(
        "Data scientist role",
        {"full_name": "Avery Example"},
        "Emphasize data analysis",
    )

    assert result == "Application plan"
    instructions, input_text = generate_text.call_args.args
    assert "Job Application Planning" in instructions
    assert json.loads(input_text) == {
        "job_advertisement": "Data scientist role",
        "career_profile": {"full_name": "Avery Example"},
        "user_guidance": "Emphasize data analysis",
    }


def test_generate_application_passes_user_edited_plan_to_prompt(monkeypatch):
    generate_text = Mock(return_value="Generated application")
    monkeypatch.setattr(application_generator, "generate_text", generate_text)
    edited_plan = "Emphasize data analysis and cross-functional leadership."

    result = application_generator.generate_job_application(
        "Data scientist role",
        {"full_name": "Avery Example"},
        edited_plan,
    )

    assert result == "Generated application"
    instructions, input_text = generate_text.call_args.args
    assert "Job Application Generator" in instructions
    assert json.loads(input_text) == {
        "job_ad": "Data scientist role",
        "career_profile": {"full_name": "Avery Example"},
        "application_plan": edited_plan,
    }


def test_prompt_paths_point_to_existing_files():
    assert application_generator.GENERATE_PLAN_PROMPT_PATH == (
        Path(application_generator.__file__).resolve().parent.parent
        / "prompts"
        / "plan_instructions.md"
    )
    assert application_generator.GENERATE_PLAN_PROMPT_PATH.is_file()
    assert application_generator.WRITE_APPLICATION_PROMPT_PATH.is_file()
