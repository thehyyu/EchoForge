# EchoForge

A bilingual (zh/en) audio content publishing platform. Upload audio files, let the pipeline transcribe and process them with AI, then publish polished articles in both languages.

## What it does

1. Upload an audio file via the admin panel
2. The pipeline transcribes the audio, uses a local LLM to refine and translate the content, and writes the result back
3. Review and publish the post — it appears on the public-facing site in both Chinese and English

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend / API | Next.js (App Router), deployed on Vercel |
| Database | Neon PostgreSQL |
| File storage | Vercel Blob |
| Auth | NextAuth.js + Google OAuth |
| AI pipeline | Ollama (Qwen2.5 14B), runs locally |

## Architecture

The pipeline runs on a local machine and polls the database every 30 seconds for new jobs. Vercel and the pipeline never communicate directly — Neon DB is the only bridge. This keeps the local LLM unexposed and prevents Vercel functions from timing out on long inference tasks.

See [ARCHITECTURE.md](../ARCHITECTURE.md) for the full system diagram.

## Environment variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `AUTH_GOOGLE_ID` | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |
| `AUTH_SECRET` | NextAuth.js secret |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token |
| `ALLOWED_EMAIL` | Admin email address (only this account can log in) |

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## License

[MIT](../LICENSE)
