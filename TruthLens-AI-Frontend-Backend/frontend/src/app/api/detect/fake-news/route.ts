import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

function clamp(value: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, Math.round(value * 10) / 10));
}

function textCredibilityInference(text: string, sourceUrl?: string) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const sentences = normalized
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => sentence.trim().length > 30);
  const sensational = (normalized.match(/\b(shocking|breaking|urgent|secret|miracle|guaranteed|exposed|you won't believe)\b/gi) || []).length;
  const absolute = (normalized.match(/\b(always|never|everyone|nobody|100%|undeniable|proves)\b/gi) || []).length;
  const missingAttribution = sentences.slice(0, 10).filter(
    (sentence) => !/\b(according to|said|reported|official|study|research)\b/i.test(sentence)
  ).length;
  const concern = Math.max(0, sensational * 8 + absolute * 6 + Math.max(0, missingAttribution - 3) * 3);
  const credibility = clamp(100 - concern);
  const risk = credibility < 40 ? 'high' : credibility < 65 ? 'medium' : 'low';
  const confidence = clamp(55 + Math.min(35, normalized.length / 400));

  const suspiciousClaims: string[] = [];
  if (sensational) suspiciousClaims.push('Sensational or urgency-heavy wording was detected.');
  if (absolute) suspiciousClaims.push('Absolute language was detected; these statements need source-level verification.');
  if (missingAttribution > 3) suspiciousClaims.push('Several statements lack clear attribution or a cited source.');
  if (!suspiciousClaims.length) suspiciousClaims.push('No strong red-flag language was detected by the local screening rules.');

  const sources = sourceUrl
    ? [{
        domain: new URL(sourceUrl).hostname.replace(/^www\./, ''),
        stance: 'neutral' as const,
        trustScore: 50,
        url: sourceUrl,
      }]
    : [];

  return {
    score: credibility,
    risk,
    confidence,
    explanation: 'This is a first-pass credibility screening based on language and attribution. It does not establish whether a claim is true or false.',
    suspiciousClaims,
    sources,
    modelsUsed: ['TruthLens Credibility Heuristics v3'],
    limitations: [
      'No claim is labeled true or false without independent evidence.',
      'For high-stakes decisions, verify important claims against primary sources.',
    ],
  };
}

async function fetchArticle(url: string) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ detail: 'Please enter a valid http(s) URL.' }, { status: 400 });
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return NextResponse.json({ detail: 'Please enter a valid http(s) URL.' }, { status: 400 });
  }

  const response = await fetch(parsed.toString(), {
    redirect: 'follow',
    signal: AbortSignal.timeout(10000),
    headers: { 'User-Agent': 'TruthLensAI/4.0' },
  });
  if (!response.ok) throw new Error(`Could not fetch the URL (${response.status}).`);

  const html = await response.text();
  const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').replace(/<[^>]+>/g, ' ').trim();
  const paragraphs = Array.from(html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi))
    .map((match) => match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const articleText = paragraphs.join(' ');
  return { title, articleText: articleText.slice(0, 20000), finalUrl: response.url || parsed.toString() };
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const content = String(payload?.content || '').trim();
    const isUrl = Boolean(payload?.is_url);
    if (!content) return NextResponse.json({ detail: 'Text or URL cannot be empty.' }, { status: 400 });

    if (isUrl) {
      const article = await fetchArticle(content);
      if (article instanceof NextResponse) return article;
      const text = `${article.title}. ${article.articleText}`;
      if (text.length < 80) {
        return NextResponse.json({ detail: 'The page did not contain enough readable article text.' }, { status: 422 });
      }
      return NextResponse.json(textCredibilityInference(text, article.finalUrl));
    }

    return NextResponse.json(textCredibilityInference(content));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Analysis failed.';
    return NextResponse.json({ detail: message }, { status: 502 });
  }
}
