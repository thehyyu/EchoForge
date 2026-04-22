import { sql } from '../lib/db'

async function migrate() {
  await sql`
    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      title_zh TEXT,
      title_en TEXT,
      slug TEXT UNIQUE,
      content_zh TEXT,
      content_en TEXT,
      status TEXT DEFAULT 'draft',
      category TEXT,
      tags TEXT[],
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS jobs (
      id SERIAL PRIMARY KEY,
      type TEXT CHECK (type IN ('voice', 'gemini')),
      source_url TEXT,
      transcript TEXT,
      post_id INTEGER REFERENCES posts(id),
      status TEXT DEFAULT 'pending',
      error_message TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  await sql`
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS tags_en TEXT[]
  `

  await sql`
    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS prompt_template TEXT
  `

  await sql`
    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS result TEXT
  `

  await sql`
    ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_type_check
  `

  await sql`
    ALTER TABLE jobs ADD CONSTRAINT jobs_type_check
    CHECK (type IN ('voice', 'gemini', 'generate', 'translate', 'generate_prompt'))
  `

  await sql`
    CREATE TABLE IF NOT EXISTS prompt_templates (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS dictionary (
      id SERIAL PRIMARY KEY,
      wrong TEXT NOT NULL,
      correct TEXT NOT NULL
    )
  `

  await sql`
    ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_type_check
  `

  await sql`
    ALTER TABLE jobs ADD CONSTRAINT jobs_type_check
    CHECK (type IN ('voice', 'gemini', 'generate', 'translate', 'generate_prompt', 'proofread'))
  `

  await sql`
    CREATE TABLE IF NOT EXISTS projects (
      id            SERIAL PRIMARY KEY,
      slug          TEXT UNIQUE NOT NULL,
      title_zh      TEXT NOT NULL,
      title_en      TEXT NOT NULL,
      tagline_zh    TEXT,
      tagline_en    TEXT,
      description_zh TEXT,
      description_en TEXT,
      tech_stack    TEXT[] DEFAULT '{}',
      github_url    TEXT,
      demo_url      TEXT,
      thumbnail_url TEXT,
      status        TEXT NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active', 'completed', 'archived')),
      started_at    DATE,
      published_at  TIMESTAMPTZ DEFAULT now(),
      hidden        BOOLEAN DEFAULT false,
      created_at    TIMESTAMPTZ DEFAULT now(),
      updated_at    TIMESTAMPTZ DEFAULT now()
    )
  `

  console.log('Migration complete')
}

migrate().catch(console.error)
