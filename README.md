# Job Application Copilot

A work-in-progress full-stack application for managing career information and eventually streamlining the job search process through LLM-powered features.

The core idea is to maintain an all-encompassing career profile containing a person's professional background, career goals, education, skills, projects, etc. This information will then be used to identify and extract the most relevant details for specific job opportunities through AI-assisted features.


<img width="1860" height="928" alt="profileView" src="https://github.com/user-attachments/assets/06de2d2b-6815-47c7-9608-b8c34885f531" />

<img width="1860" height="928" alt="applicationSetupView" src="https://github.com/user-attachments/assets/7b6ec46d-d65c-4139-86a3-87ccc3007adf" />

<img width="1860" height="928" alt="applicationPlanView" src="https://github.com/user-attachments/assets/496e53ed-56a9-4501-a2bc-2eda523ad7f1" />

<img width="1860" height="928" alt="applicationWritingView" src="https://github.com/user-attachments/assets/12ba0c51-f129-491d-acde-e6a560f94e2b" />


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

The application supports career profile management and a complete, three-step AI-assisted application drafting workflow. Users can enter a job advertisement, optionally provide guidance about what to emphasize, review and edit an AI-generated application plan, then generate, edit, and export an application draft. The profile includes basic information, education, work experience, skills, projects, languages, and hobbies.

The workflow is functional, but generated plans, drafts, and edits are held in frontend state rather than persisted between page reloads or separate visits. The application editor's chat area is a placeholder; conversational refinement is not implemented. The database already has tables for application sessions and messages, but the workflow does not yet use them. The backend includes request validation, AI-provider error handling, database migrations, and automated tests. Authentication and authorization for public multi-user use are not implemented.

**Next steps:**
- Connect application sessions to the existing database tables, extending the schema as needed, so job details, plans, generated drafts, edits, and future conversation history can be saved and restored.
- Implement conversational application refinement in the editor, including backend support and persistence for messages and revised drafts.
- Evaluate and improve the planning and application-generation prompts using representative job advertisements and profiles.
- Add generation controls, such as writing-style preferences and choosing which profile experiences or projects to emphasize.
- Continue improving usability and accessibility across the profile and application workflow.
- Add authentication and authorization to support multiple users and potential deployment of the app.
