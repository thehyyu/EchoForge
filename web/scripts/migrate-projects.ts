import { sql } from '../lib/db'

async function run() {
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
  console.log('projects table ready')
}

run().catch(console.error)
