# Habitat AI

World-class, AI-powered platform for real estate developers to automate lead generation, qualification, and delivery on a pay-per-qualified-lead basis.

## Monorepo Structure

- `supabase/`: SQL schema and indexes
- `backend/`: FastAPI microservice for RAG (deployed separately on Vercel)
- `frontend/`: React dashboard (Next.js + Tailwind + Shadcn/UI)
- `n8n/`: Modular workflow JSON templates
- `tests/`: Python tests for backend

## Prerequisites

- Python 3.10+
- Node.js 18+
- Supabase project (PostgreSQL + pgvector)
- OpenAI API Key
- Twilio WhatsApp Business API credentials

## Supabase

1) Create the database schema

```bash
psql "$SUPABASE_DB_URL" -f supabase/schema.sql
```

2) Configure RLS policies as needed (MVP may rely on service role for writes and anon key for safe reads).

## Backend (FastAPI RAG microservice)

1) Create and populate `.env` from example

```bash
cp backend/.env.example backend/.env
```

2) Install dependencies and run locally

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn api.main:app --reload --port 8000
```

3) Tests

```bash
pytest -q
```

4) Deploy to Vercel (as a separate project pointing to `backend/`)

- Set env vars in Vercel Dashboard
- Ensure `backend/vercel.json` is present

## Frontend (Next.js + Tailwind + Shadcn/UI)

1) Create and populate `.env.local` from example

```bash
cp frontend/.env.local.example frontend/.env.local
```

2) Install and run

```bash
cd frontend
npm install
npm run dev
```

3) Deploy to Vercel (as a separate project pointing to `frontend/`)

- Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## n8n Workflows

Import JSON files from `n8n/` and set webhook URLs to your deployed services.

## Security

- Never commit secrets. Use environment variables.
- Backend connects to DB via service role; frontend uses anon key with RLS.

## Licensing

Copyright © Habitat AI. All rights reserved. 