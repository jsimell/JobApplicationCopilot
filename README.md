# Job Application Copilot

A work-in-progress full-stack application for managing career information and eventually streamlining the job search process through LLM-powered features.

The core idea is to maintain an all-encompassing career profile containing a person's professional background, career goals, education, skills, projects, etc. This information will then be used to identify and extract the most relevant details for specific job opportunities through future AI-assisted features.

<img width="1863" height="934" alt="Screenshot From 2026-11-11 15-08-19" src="https://github.com/user-attachments/assets/de04c308-a106-4a40-bab8-ce1a3387a423" />

## Development Goals

The project serves two main purposes:

- **Developing full-stack development skills:** Building on existing frontend development and LLM integration experience while gaining hands-on experience with backend development, REST APIs, relational databases, automated testing, and AI-assisted development.
- **Improving and speeding up my job search workflow:** Creating a practical tool for maintaining career information and making the process of preparing job applications more efficient.

## Tech Stack

- **Backend:** Python, FastAPI, PostgreSQL, Pydantic
- **Frontend:** React, TypeScript, Next.js
- **Testing:** pytest, FastAPI TestClient
- **LLM Features:** OpenAI API

## Current Status & Next Steps

The backend and frontend are functional, supporting career profile management and the first unoptimized version of LLM-powered job application generation. The backend also includes automated testing, input validation, error handling, and database migrations.

**Next steps:**
- Improve the AI-assisted application writing workflow, particularly through iterative conversational refinement and internal system prompt optimization.
- Introduce additional controls for application generation, such as writing style preferences and selection of relevant career experiences.
- Implement application session persistence and conversation history.
- Improve frontend usability, moving from a prototype to a more polished design.
- Potentially, in the future, implement user authentication and authorization to support public multi-user access, extending my backend skills even further.
