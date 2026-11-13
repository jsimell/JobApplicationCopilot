# Job Application Copilot

A work-in-progress full-stack application for managing career information and eventually streamlining the job search process through LLM-powered features.

The core idea is to maintain an all-encompassing career profile containing a person's professional background, career goals, education, skills, projects, etc. This information will then be used to identify and extract the most relevant details for specific job opportunities through future AI-assisted features.

<img width="1863" height="934" alt="Screenshot From 2026-11-11 15-08-19" src="https://github.com/user-attachments/assets/de04c308-a106-4a40-bab8-ce1a3387a423" />

## Development Goals

The project serves two main purposes:

- **Developing full-stack development skills:** Building on existing frontend development and LLM integration experience while gaining hands-on experience with backend development, REST APIs, relational databases, automated testing, and AI-assisted development.
- **Improving the job search workflow:** Creating a practical tool for maintaining career information and making the process of preparing job applications more efficient.

## Tech Stack

- **Backend:** Python, FastAPI, PostgreSQL, Pydantic
- **Frontend:** React, TypeScript, Next.js
- **Testing:** pytest, FastAPI TestClient
- **LLM Features:** OpenAI API (planned)

## Current Status & Next Steps

The FastAPI backend, PostgreSQL database, automated backend tests, and an initial prototype of the Next.js/React frontend are implemented. Profile information can be created, updated, and retrieved through the backend API, and the frontend allows users to view and edit their profile information.

**Next steps:**
- Improve the design of the profile panel and fix usability issues to move from a prototype to a more polished design.
- Design the LLM API integration and begin implementing the LLM-powered features.
- Potentially implement user authentication and authorization as additional backend development practice.
