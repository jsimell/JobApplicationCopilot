import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY"),
)


def generate_text(instructions: str, input: str):
    openai_response = client.responses.create(
        model=os.environ["OPENAI_MODEL"],
        instructions=instructions,
        input=input
    )
    return openai_response.output_text
