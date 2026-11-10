from datetime import date
from decimal import Decimal

import psycopg
from psycopg import sql
from psycopg.rows import dict_row
import os
from dotenv import load_dotenv
from uuid import UUID

load_dotenv()


# Helpers for executing queries
def execute_query(query: str, params: tuple = ()):
    with psycopg.connect(os.environ["DATABASE_URL"]) as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, params)
            return cur.fetchone()


def execute_query_all(query: str, params: tuple = ()):
    with psycopg.connect(os.environ["DATABASE_URL"]) as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, params)
            return cur.fetchall()


# User Functions
def create_user(user_id: UUID):
    return execute_query("""
                INSERT INTO users (user_id)
                VALUES (%s)
                ON CONFLICT (user_id) DO NOTHING
                RETURNING user_id;
                """, (user_id,)
    )


def get_users():  # For testing
    return execute_query_all(
        """SELECT * FROM users;""", ()
    )


# Profile Functions
def create_profile(
    user_id: UUID,
    full_name: str | None,
    headline: str | None,
    location: str | None,
    summary: str | None,
    career_goals_description: str | None,
):
    return execute_query("""
                INSERT INTO profiles (user_id, full_name, headline, location, summary, career_goals_description)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING profile_id, user_id, full_name, headline, location, summary, career_goals_description;
                """, (user_id, full_name, headline, location, summary, career_goals_description)
    )


def get_profile(profile_id: int):
    return execute_query(
        """SELECT * FROM profiles WHERE profile_id = %s;""", (profile_id,)
    )


def get_profile_by_user_id(user_id: UUID):
    return execute_query(
        """SELECT * FROM profiles WHERE user_id = %s;""", (user_id,)
    )


def get_profiles():
    return execute_query_all(
        """SELECT * FROM profiles;""", ()
    )


def delete_profile(profile_id: int):
    return execute_query(
        """DELETE FROM profiles WHERE profile_id = %s RETURNING profile_id;""",
        (profile_id,),
    )


def update_profile(profile_id: int, **fields):
    if not fields:
        return get_profile(profile_id)

    assignments = sql.SQL(", ").join(
        sql.SQL("{} = %s").format(sql.Identifier(column))
        for column in fields
    )

    query = sql.SQL("""
        UPDATE profiles
        SET {}
        WHERE profile_id = %s
        RETURNING *;
    """).format(assignments)

    return execute_query(query, (*fields.values(), profile_id))


# Work Experience Functions
def create_work_experience(
    profile_id: int,
    title: str | None,
    company: str | None,
    location: str | None,
    start_date: date | None,
    end_date: date | None,
    description: str | None,
):

    return execute_query("""
                INSERT INTO work_experiences (profile_id, title, company, location, start_date, end_date, description)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING work_experience_id, profile_id, title, company, location, start_date, end_date, description;
                """, (profile_id, title, company, location, start_date, end_date, description)
    )


def get_work_experiences(profile_id: int):
    return execute_query_all(
        """SELECT * FROM work_experiences WHERE profile_id = %s;""", (
            profile_id,)
    )


def delete_work_experience(work_experience_id: int):
    return execute_query(
        """DELETE FROM work_experiences WHERE work_experience_id = %s
           RETURNING work_experience_id;""",
        (work_experience_id,),
    )


def update_work_experience(work_experience_id: int, **fields):

    assignments = sql.SQL(", ").join(
        sql.SQL("{} = %s").format(sql.Identifier(column))
        for column in fields
    )

    query = sql.SQL("""
        UPDATE work_experiences
        SET {}
        WHERE work_experience_id = %s
        RETURNING *;
    """).format(assignments)

    return execute_query(query, (*fields.values(), work_experience_id))


# Education/Degrees Functions
def create_degree(profile_id: int, title: str, finished_date: date, school: str, location: str, gpa: Decimal | None, major: str | None, minor: str | None, additional_information: str | None):
    return execute_query("""
                INSERT INTO degrees (
                    profile_id, title, finished_date, school, location, gpa, major, minor,
                    additional_information
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING degree_id, profile_id, finished_date, title, school, location, gpa,
                    major, minor, additional_information;
                """, (profile_id, title, finished_date, school, location, gpa, major, minor,
                      additional_information)
    )


def get_degrees(profile_id: int):
    return execute_query_all(
        """SELECT * FROM degrees WHERE profile_id = %s;""", (profile_id,)
    )


def delete_degree(degree_id: int):
    return execute_query(
        """DELETE FROM degrees WHERE degree_id = %s RETURNING degree_id;""", (
            degree_id,)
    )


def update_degree(degree_id: int, **fields):
    if not fields:
        return execute_query(
            """SELECT * FROM degrees WHERE degree_id = %s;""", (degree_id,)
        )

    assignments = sql.SQL(", ").join(
        sql.SQL("{} = %s").format(sql.Identifier(column))
        for column in fields
    )

    query = sql.SQL("""
        UPDATE degrees
        SET {}
        WHERE degree_id = %s
        RETURNING *;
    """).format(assignments)

    return execute_query(query, (*fields.values(), degree_id))


# Project Functions
def create_project(profile_id: int, title: str, subtitle: str | None, start_date: date, end_date: date | None, description: str | None, url: str | None):
    return execute_query("""
                INSERT INTO projects (profile_id, title, subtitle, start_date, end_date, description, url)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING project_id, profile_id, title, subtitle, start_date, end_date, description, url;
                """, (profile_id, title, subtitle, start_date, end_date, description, url)
    )


def get_projects(profile_id: int):
    return execute_query_all(
        """SELECT * FROM projects WHERE profile_id = %s;""", (profile_id,)
    )


def get_project(project_id: int):
    return execute_query(
        """SELECT * FROM projects WHERE project_id = %s;""", (project_id,)
    )


def delete_project(project_id: int):
    return execute_query(
        """DELETE FROM projects WHERE project_id = %s RETURNING project_id;""",
        (project_id,),
    )


def update_project(project_id: int, **fields):
    if not fields:
        return execute_query(
            """SELECT * FROM projects WHERE project_id = %s;""", (project_id,)
        )

    assignments = sql.SQL(", ").join(
        sql.SQL("{} = %s").format(sql.Identifier(column))
        for column in fields
    )

    query = sql.SQL("""
        UPDATE projects
        SET {}
        WHERE project_id = %s
        RETURNING *;
    """).format(assignments)

    return execute_query(query, (*fields.values(), project_id))


# Skills Functions
def create_skill(profile_id: int, name: str, proficiency: str | None):
    return execute_query("""
                INSERT INTO skills (profile_id, name, proficiency)
                VALUES (%s, %s, %s)
                RETURNING skill_id, profile_id, name, proficiency;
                """, (profile_id, name, proficiency)
    )


def get_skills(profile_id: int):
    return execute_query_all(
        """SELECT * FROM skills WHERE profile_id = %s;""", (profile_id,)
    )


def delete_skill(skill_id: int):
    return execute_query(
        """DELETE FROM skills WHERE skill_id = %s RETURNING skill_id;""", (
            skill_id,)
    )


def update_skill(skill_id: int, **fields):
    if not fields:
        return execute_query(
            """SELECT * FROM skills WHERE skill_id = %s;""", (skill_id,)
        )

    assignments = sql.SQL(", ").join(
        sql.SQL("{} = %s").format(sql.Identifier(column))
        for column in fields
    )

    query = sql.SQL("""
        UPDATE skills
        SET {}
        WHERE skill_id = %s
        RETURNING *;
    """).format(assignments)

    return execute_query(query, (*fields.values(), skill_id))


# Language Functions
def create_language(profile_id: int, language: str, proficiency: str | None):
    return execute_query("""
                INSERT INTO languages (profile_id, language, proficiency)
                VALUES (%s, %s, %s)
                RETURNING language_id, profile_id, language, proficiency;
                """, (profile_id, language, proficiency)
    )


def get_languages(profile_id: int):
    return execute_query_all(
        """SELECT * FROM languages WHERE profile_id = %s;""", (profile_id,)
    )


def delete_language(language_id: int):
    return execute_query(
        """DELETE FROM languages WHERE language_id = %s RETURNING language_id;""",
        (language_id,),
    )


def update_language(language_id: int, **fields):
    if not fields:
        return execute_query(
            """SELECT * FROM languages WHERE language_id = %s;""", (language_id,)
        )

    assignments = sql.SQL(", ").join(
        sql.SQL("{} = %s").format(sql.Identifier(column))
        for column in fields
    )

    query = sql.SQL("""
        UPDATE languages
        SET {}
        WHERE language_id = %s
        RETURNING *;
    """).format(assignments)

    return execute_query(query, (*fields.values(), language_id))


# Hobby Functions
def create_hobby(profile_id: int, name: str, description: str | None):
    return execute_query("""
                INSERT INTO hobbies (profile_id, name, description)
                VALUES (%s, %s, %s)
                RETURNING hobby_id, profile_id, name, description;
                """, (profile_id, name, description)
    )


def get_hobbies(profile_id: int):
    return execute_query_all(
        """SELECT * FROM hobbies WHERE profile_id = %s;""", (profile_id,)
    )


def delete_hobby(hobby_id: int):
    return execute_query(
        """DELETE FROM hobbies WHERE hobby_id = %s RETURNING hobby_id;""", (
            hobby_id,)
    )


def update_hobby(hobby_id: int, **fields):
    if not fields:
        return execute_query(
            """SELECT * FROM hobbies WHERE hobby_id = %s;""", (hobby_id,)
        )

    assignments = sql.SQL(", ").join(
        sql.SQL("{} = %s").format(sql.Identifier(column))
        for column in fields
    )

    query = sql.SQL("""
        UPDATE hobbies
        SET {}
        WHERE hobby_id = %s
        RETURNING *;
    """).format(assignments)

    return execute_query(query, (*fields.values(), hobby_id))


# Project Skill Functions
def create_project_skill(project_id: int, skill_id: int):
    return execute_query("""
                INSERT INTO project_skills (project_id, skill_id)
                SELECT p.project_id, s.skill_id
                FROM projects p
                JOIN skills s ON p.profile_id = s.profile_id
                WHERE p.project_id = %s AND s.skill_id = %s
                RETURNING project_id, skill_id;
                """, (project_id, skill_id)
    )


def get_project_skills(project_id: int):
    return execute_query_all("""
                SELECT * FROM project_skills
                WHERE project_id = %s
                """, (project_id,)
    )


def delete_project_skill(project_id: int, skill_id: int):
    return execute_query("""
                DELETE FROM project_skills
                WHERE project_id = %s AND skill_id = %s
                RETURNING project_id, skill_id;
                """, (project_id, skill_id)
    )
