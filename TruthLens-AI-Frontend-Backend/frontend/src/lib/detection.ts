const API_URL = '';

export interface Signal {
  name: string;
  score: number;
  description: string;
}

export interface SourceVerification {
  domain: string;
  stance: 'supports' | 'contradicts' | 'neutral';
  trustScore: number;
  url?: string;
}

export interface DeepfakeResult {
  score: number;
  fakeProbability: number;
  prediction: 'Likely AI-generated' | 'Likely authentic' | 'Inconclusive';
  risk: 'low' | 'medium' | 'high';
  confidence: number;
  explanation: string;
  signals: Signal[];
  supportingDiagnostics?: Signal[];
  modelsUsed: string[];
  metadata?: { width: number; height: number; format?: string; fileSizeKb?: number };
  verification?: {
    mode: 'local_only' | 'cross_checked' | 'external_only';
    agreement: 'agree' | 'disagree' | 'not_available';
    external?: {
      status: string;
      provider: string;
      score?: number | null;
      classification?: string;
      message?: string;
      models?: { name: string; status: string; score: number }[];
    };
    local?: { prediction: string; fakeProbability: number };
  };
}

export interface FakeNewsResult {
  score: number;
  risk: 'low' | 'medium' | 'high';
  confidence: number;
  explanation: string;
  suspiciousClaims: string[];
  sources: SourceVerification[];
  modelsUsed: string[];
  limitations?: string[];
}

async function parseResponse(res: Response) {
  let body: any = null;
  try {
    body = await res.json();
  } catch {}
  if (!res.ok) {
    throw new Error(body?.detail || `Server error (${res.status})`);
  }
  return body;
}

export async function analyzeDeepfakeImage(file: File): Promise<DeepfakeResult> {
  const formData = new FormData();
  formData.append('file', file);
  let res: Response;
  try {
    res = await fetch('/api/detect/deepfake', { method: 'POST', body: formData });
  } catch {
    throw new Error('Unable to reach the Reality Defender API.');
  }
  return parseResponse(res);
}

export async function analyzeFakeNews(content: string, isUrl = false): Promise<FakeNewsResult> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/detect/fake-news`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, is_url: isUrl }),
    });
  } catch {
    throw new Error('Cannot reach the AI backend. Make sure FastAPI is running on port 8000.');
  }
  return parseResponse(res);
}

export type HistoryEntry = {
  id: string;
  timestamp: string;
  type: string;
  target: string;
  score: number;
  risk: 'low' | 'medium' | 'high';
  confidence: number;
  topFlag: string;
  explanation: string;
  modelsUsed: string[];
};

const HISTORY_KEY = 'truthlens-history';

export function saveHistory(entry: HistoryEntry) {
  if (typeof window === 'undefined') return;
  const current: HistoryEntry[] = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  localStorage.setItem(HISTORY_KEY, JSON.stringify([entry, ...current].slice(0, 50)));
}

export function getHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
}

export function clearHistory() {
  if (typeof window !== 'undefined') localStorage.removeItem(HISTORY_KEY);
}
