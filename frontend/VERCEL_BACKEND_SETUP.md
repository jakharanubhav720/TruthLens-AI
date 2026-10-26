# TruthLens Vercel backend setup

The Next.js app now contains Vercel API routes for:
- POST /api/detect/deepfake
- POST /api/detect/fake-news

The deepfake route uses Reality Defender's official TypeScript SDK. The API key is read only from the server-side `REALITY_DEFENDER_API_KEY` environment variable.

The fake-news route reads `GOOGLE_FACT_CHECK_API_KEY` on the server and searches Google's Fact Check Tools API. Set that variable in Vercel project settings. Do not expose it as `NEXT_PUBLIC_GOOGLE_FACT_CHECK_API_KEY`.

Important: Vercel's request payload limit means this version accepts images up to 4 MB. Reality Defender itself supports larger images, but the request must first pass through the Vercel function.
