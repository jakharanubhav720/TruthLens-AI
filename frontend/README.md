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

The frontend does not contain the Reality Defender API key. Keep that key in the backend environment only.

## Deploy

This project can be deployed as a Next.js app on Vercel or another Node.js hosting provider.

Set this environment variable on the frontend host:

```env
NEXT_PUBLIC_API_URL=https://YOUR-BACKEND-URL
```
