import { NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import { RealityDefender } from '@realitydefender/realitydefender';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

function predictionFrom(status: string, score: number) {
  const normalized = status.toUpperCase();
  if (['MANIPULATED', 'FAKE', 'ARTIFICIAL', 'SYNTHETIC'].some((x) => normalized.includes(x))) {
    return 'Likely AI-generated' as const;
  }
  if (['AUTHENTIC', 'REAL', 'GENUINE'].some((x) => normalized.includes(x))) {
    return 'Likely authentic' as const;
  }
  if (score >= 65) return 'Likely AI-generated' as const;
  if (score <= 35) return 'Likely authentic' as const;
  return 'Inconclusive' as const;
}

export async function POST(request: Request) {
  const apiKey = process.env.REALITY_DEFENDER_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { detail: 'Reality Defender API key is not configured on Vercel.' },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const entry = formData.get('file');

    if (!(entry instanceof File)) {
      return NextResponse.json({ detail: 'Please upload an image file.' }, { status: 400 });
    }

    if (!entry.type.startsWith('image/')) {
      return NextResponse.json(
        { detail: 'Please upload a JPG, PNG, WEBP, GIF, or other supported image.' },
        { status: 400 }
      );
    }

    if (entry.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { detail: 'Image is larger than 4 MB. Please upload a smaller image.' },
        { status: 413 }
      );
    }

    const bytes = Buffer.from(await entry.arrayBuffer());
    const extension = path.extname(entry.name || '').toLowerCase() || '.jpg';
    const safeExtension = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(extension)
      ? extension
      : '.jpg';
    const tempPath = `/tmp/truthlens-${Date.now()}${safeExtension}`;

    await writeFile(tempPath, bytes);

    try {
      const client = new RealityDefender({ apiKey });
      const result = await client.detect(
        { filePath: tempPath },
        { maxAttempts: 20, pollingInterval: 2000 }
      );

      const rawScore = Number(result.score);
      if (!Number.isFinite(rawScore)) {
        return NextResponse.json(
          { detail: 'Reality Defender did not return a usable detection score.' },
          { status: 502 }
        );
      }

      const fakeProbability = Math.max(0, Math.min(100, Math.round(rawScore * 1000) / 10));
      const status = String(result.status || 'UNKNOWN');
      const prediction = predictionFrom(status, fakeProbability);
      const confidence = Math.round(Math.abs(fakeProbability - 50) * 2 * 10) / 10;

      const signals = (result.models || [])
        .filter((model) => model?.score != null)
        .map((model) => ({
          name: String(model.name || 'Reality Defender model'),
          score: Math.round(Number(model.score) * 1000) / 10,
          description: `Reality Defender model status: ${String(model.status || 'UNKNOWN')}.`,
        }));

      if (!signals.length) {
        signals.push({
          name: 'Overall manipulation score',
          score: fakeProbability,
          description: `Reality Defender overall status: ${status}.`,
        });
      }

      return NextResponse.json({
        score: fakeProbability,
        fakeProbability,
        prediction,
        risk: fakeProbability >= 65 ? 'high' : fakeProbability <= 35 ? 'low' : 'medium',
        confidence,
        explanation:
          prediction === 'Likely AI-generated'
            ? 'Reality Defender detected signals associated with manipulated or synthetic media. This is a screening result, not proof.'
            : prediction === 'Likely authentic'
              ? 'Reality Defender did not detect strong manipulation signals. This is a screening result, not proof of authenticity.'
              : 'Reality Defender returned an inconclusive result. Treat this image as requiring additional verification.',
        signals,
        modelsUsed: ['Reality Defender'],
        metadata: {
          width: 0,
          height: 0,
          format: entry.type,
          fileSizeKb: Math.round((entry.size / 1024) * 10) / 10,
        },
        verification: {
          mode: 'external_only',
          agreement: 'not_available',
          external: {
            status: 'complete',
            provider: 'Reality Defender',
            score: fakeProbability,
            classification: status,
            models: signals.map((signal) => ({
              name: signal.name,
              status: 'complete',
              score: signal.score,
            })),
          },
        },
      });
    } finally {
      await unlink(tempPath).catch(() => undefined);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Image analysis failed.';
    return NextResponse.json({ detail: `Reality Defender analysis failed: ${message}` }, { status: 502 });
  }
}
