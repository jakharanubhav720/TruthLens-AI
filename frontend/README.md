# TruthLens AI — Frontend

Next.js frontend for TruthLens AI.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set `NEXT_PUBLIC_API_URL` to the URL where the FastAPI backend is deployed.

For local development:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Fake-news scans call the same-origin route `/api/detect/fake-news`. That route reads `GOOGLE_FACT_CHECK_API_KEY` on the server and queries Google's Fact Check Tools API. Deepfake scans still call the FastAPI backend.

Keep `GOOGLE_FACT_CHECK_API_KEY` and `REALITY_DEFENDER_API_KEY` server-side. Do not prefix either key with `NEXT_PUBLIC_`.

## Deploy

This project can be deployed as a Next.js app on Vercel or another Node.js hosting provider.

Set this environment variable on the frontend host:

```env
NEXT_PUBLIC_API_URL=https://YOUR-BACKEND-URL
```
