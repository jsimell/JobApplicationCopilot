import os
from functools import lru_cache

from openai import OpenAI


# Cache the OpenAI client to reuse connections and avoid import-time initialization
@lru_cache(maxsize=1)
def get_openai_client() -> OpenAI:
    return OpenAI(
        api_key=os.environ.get("OPENAI_API_KEY"),
    )


def generate_text(instructions: str, input: str) -> str:
    client = get_openai_client()

    openai_response = client.responses.create(
        model=os.environ["OPENAI_MODEL"],
        instructions=instructions,
        input=input,
    )

    return openai_response.output_text
