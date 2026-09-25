# TruthLens Vercel backend setup

The Next.js app now contains Vercel API routes for:
- POST /api/detect/deepfake
- POST /api/detect/fake-news

The deepfake route uses Reality Defender's official TypeScript SDK. The API key is read only from the server-side `REALITY_DEFENDER_API_KEY` environment variable.

Important: Vercel's request payload limit means this version accepts images up to 4 MB. Reality Defender itself supports larger images, but the request must first pass through the Vercel function.
