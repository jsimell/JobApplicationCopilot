import type { CareerProfile } from './types'

const PROFILE_ID = 1

export const sampleProfile: CareerProfile = {
  basic_details: {
    profile_id: PROFILE_ID,
    user_id: '6f1c2a4e-8b3d-4f7a-9c21-5d0e8a7b3f10',
    full_name: 'Elena Marković',
    headline: 'Senior Data Engineer · Analytics Platforms & ML Infrastructure',
    location: 'Munich, Germany',
    summary:
      'Data engineer with 7+ years of experience designing reliable batch and streaming pipelines for product analytics and machine learning. I enjoy turning messy operational data into trustworthy datasets that teams actually use, and I care about observability, cost efficiency, and developer experience.',
    career_goals_description:
      'Over the next two to three years I want to grow into a Staff-level role where I shape the data platform strategy for a product-led company. I am especially interested in real-time feature stores, data contracts between teams, and mentoring engineers transitioning from analytics into platform work. I prefer hybrid roles in Munich or fully remote positions within the EU.',
  },
  degrees: [
    {
      id: 1,
      profile_id: PROFILE_ID,
      title: 'M.Sc. Computer Science',
      school: 'Technical University of Munich',
      location: 'Munich, Germany',
      finished_date: '2018-09-01',
      gpa: 1.4,
      major: 'Data Engineering & Analytics',
      minor: 'Operations Research',
      additional_information:
        'Thesis: "Incremental view maintenance for large-scale event streams" — graded 1.0. Teaching assistant for Database Systems.',
    },
    {
      id: 2,
      profile_id: PROFILE_ID,
      title: 'B.Sc. Mathematics',
      school: 'University of Belgrade',
      location: 'Belgrade, Serbia',
      finished_date: '2016-07-01',
      gpa: 9.2,
      major: 'Applied Mathematics',
      minor: null,
      additional_information: 'Erasmus exchange semester at KU Leuven.',
    },
  ],
  work_experiences: [
    {
      id: 1,
      profile_id: PROFILE_ID,
      title: 'Senior Data Engineer',
      company: 'Flowline Mobility',
      location: 'Munich, Germany · Hybrid',
      start_date: '2022-03-01',
      end_date: null,
      description:
        'Lead engineer for the analytics platform serving 40+ internal teams.\n• Migrated 300+ Airflow DAGs to a dbt + Dagster stack, cutting pipeline failures by 62%.\n• Designed a Kafka-based streaming layer for near real-time trip metrics.\n• Introduced data contracts and automated quality checks across product domains.',
    },
    {
      id: 2,
      profile_id: PROFILE_ID,
      title: 'Data Engineer',
      company: 'Kestrel Analytics',
      location: 'Berlin, Germany',
      start_date: '2019-01-01',
      end_date: '2022-02-01',
      description:
        'Built and maintained ELT pipelines on Snowflake for retail clients.\n• Reduced warehouse costs by 35% through clustering and incremental models.\n• Developed an internal Python SDK for ingestion connectors.',
    },
    {
      id: 3,
      profile_id: PROFILE_ID,
      title: 'Working Student, Business Intelligence',
      company: 'Sonnenhof Energy',
      location: 'Munich, Germany',
      start_date: '2017-04-01',
      end_date: '2018-10-01',
      description: 'Created Tableau dashboards for grid operations and automated weekly reporting with Python.',
    },
  ],
  skills: [
    { id: 1, profile_id: PROFILE_ID, name: 'Python', proficiency: 'Expert' },
    { id: 2, profile_id: PROFILE_ID, name: 'SQL', proficiency: 'Expert' },
    { id: 3, profile_id: PROFILE_ID, name: 'dbt', proficiency: 'Advanced' },
    { id: 4, profile_id: PROFILE_ID, name: 'Apache Kafka', proficiency: 'Advanced' },
    { id: 5, profile_id: PROFILE_ID, name: 'Dagster', proficiency: 'Advanced' },
    { id: 6, profile_id: PROFILE_ID, name: 'Snowflake', proficiency: 'Advanced' },
    { id: 7, profile_id: PROFILE_ID, name: 'PostgreSQL', proficiency: 'Advanced' },
    { id: 8, profile_id: PROFILE_ID, name: 'Terraform', proficiency: 'Intermediate' },
    { id: 9, profile_id: PROFILE_ID, name: 'Kubernetes', proficiency: 'Intermediate' },
    { id: 10, profile_id: PROFILE_ID, name: 'FastAPI', proficiency: 'Intermediate' },
    { id: 11, profile_id: PROFILE_ID, name: 'Data Modeling', proficiency: null },
    { id: 12, profile_id: PROFILE_ID, name: 'Mentoring', proficiency: null },
  ],
  projects: [
    {
      id: 1,
      profile_id: PROFILE_ID,
      title: 'Open Transit Feed Validator',
      subtitle: 'Open-source GTFS data quality toolkit',
      project_date: '2023-05-01',
      status: 'ongoing',
      description:
        'A command-line tool and web service that validates public transit feeds against 80+ rules and produces actionable reports. Used by three regional transit agencies.',
      url: 'https://github.com/emarkovic/transit-validator',
      skill_ids: [1, 10, 7],
    },
    {
      id: 2,
      profile_id: PROFILE_ID,
      title: 'Real-time Trip Metrics',
      subtitle: 'Streaming analytics at Flowline',
      project_date: '2023-04-01',
      status: 'completed',
      description:
        'Designed a streaming architecture that computes trip KPIs within seconds of events, replacing an hourly batch job and enabling live operations dashboards.',
      url: null,
      skill_ids: [4, 1, 9, 11],
    },
  ],
  languages: [
    { id: 1, profile_id: PROFILE_ID, language: 'Serbian', proficiency: 'Native' },
    { id: 2, profile_id: PROFILE_ID, language: 'English', proficiency: 'Proficient (C2)' },
    { id: 3, profile_id: PROFILE_ID, language: 'German', proficiency: 'Advanced (C1)' },
  ],
  hobbies: [
    {
      id: 1,
      profile_id: PROFILE_ID,
      name: 'Alpine hiking',
      description: 'Multi-day hut-to-hut tours in the Bavarian and Austrian Alps; completed the Via Alpina red trail section in 2024.',
    },
    { id: 2, profile_id: PROFILE_ID, name: 'Film photography', description: 'Shooting and developing 35mm black and white film.' },
    { id: 3, profile_id: PROFILE_ID, name: 'Chess', description: null },
  ],
}
