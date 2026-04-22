#!/usr/bin/env python3
"""Publish a project to the blog DB. Usage: python scripts/publish_project.py /path/to/project-repo"""
import sys
import os
import re
from pathlib import Path

import yaml
import psycopg
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / 'web' / '.env.local')


def read_yml(project_dir: Path) -> dict:
    yml_path = project_dir / 'project.yml'
    if not yml_path.exists():
        print(f"Error: {yml_path} not found")
        sys.exit(1)
    with open(yml_path) as f:
        data = yaml.safe_load(f)
    for field in ('slug', 'title_zh', 'title_en'):
        if not data.get(field):
            print(f"Error: missing required field '{field}' in project.yml")
            sys.exit(1)
    return data


def read_readme(project_dir: Path) -> tuple:
    zh_path = project_dir / 'README.md'
    en_path = project_dir / 'README.en.md'
    description_zh = zh_path.read_text() if zh_path.exists() else None
    description_en = en_path.read_text() if en_path.exists() else None
    return description_zh, description_en


def upsert_project(data: dict, description_zh, description_en):
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        print("Error: DATABASE_URL not set")
        sys.exit(1)

    started_at = data.get('started_at')
    if started_at and re.match(r'^\d{4}-\d{2}$', str(started_at)):
        started_at = f"{started_at}-01"

    tech_stack = data.get('tech_stack') or []

    with psycopg.connect(database_url) as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO projects (
                    slug, title_zh, title_en, tagline_zh, tagline_en,
                    description_zh, description_en, tech_stack,
                    github_url, demo_url, status, started_at, updated_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                ON CONFLICT (slug) DO UPDATE SET
                    title_zh      = EXCLUDED.title_zh,
                    title_en      = EXCLUDED.title_en,
                    tagline_zh    = EXCLUDED.tagline_zh,
                    tagline_en    = EXCLUDED.tagline_en,
                    description_zh = EXCLUDED.description_zh,
                    description_en = EXCLUDED.description_en,
                    tech_stack    = EXCLUDED.tech_stack,
                    github_url    = EXCLUDED.github_url,
                    demo_url      = EXCLUDED.demo_url,
                    status        = EXCLUDED.status,
                    started_at    = EXCLUDED.started_at,
                    updated_at    = NOW()
            """, (
                data['slug'], data['title_zh'], data['title_en'],
                data.get('tagline_zh'), data.get('tagline_en'),
                description_zh, description_en,
                tech_stack,
                data.get('github_url'), data.get('demo_url'),
                data.get('status', 'active'),
                started_at,
            ))
            conn.commit()


def main():
    if len(sys.argv) != 2:
        print("Usage: python scripts/publish_project.py /path/to/project-repo")
        sys.exit(1)

    project_dir = Path(sys.argv[1]).resolve()
    if not project_dir.is_dir():
        print(f"Error: {project_dir} is not a directory")
        sys.exit(1)

    data = read_yml(project_dir)
    description_zh, description_en = read_readme(project_dir)
    upsert_project(data, description_zh, description_en)

    slug = data['slug']
    print(f"✓ Published: {slug} → https://thehyyu-blog.vercel.app/zh/projects/{slug}")


if __name__ == '__main__':
    main()
