'use client';
import { useState } from 'react';
import { analyzeFakeNews, FakeNewsResult, saveHistory } from '@/lib/detection';
import ScoreRing from '@/components/ScoreRing';
import { AlertTriangle, CheckCircle, ExternalLink, Loader2 } from 'lucide-react';

export default function FakeNewsPage() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FakeNewsResult | null>(null);
  const [error, setError] = useState('');

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setError('');
    try {
      const isUrl = content.trim().startsWith('http://') || content.trim().startsWith('https://');
      const data = await analyzeFakeNews(content, isUrl);
      setResult(data);
      saveHistory({
        id: `TL-${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        type: 'Credibility Screening',
        target: isUrl ? content.trim() : content.trim().slice(0, 80),
        score: data.score,
        risk: data.risk,
        confidence: data.confidence,
        topFlag: data.suspiciousClaims[0] || 'No strong red flag',
        explanation: data.explanation,
        modelsUsed: data.modelsUsed
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Fake News & Disinformation Scanner</h1>
        <p className="text-slate-400 text-sm mt-1">Cross-check article statements and public URLs against verified databases.</p>
      </div>

      <form onSubmit={handleAnalyze} className="flex flex-col gap-4">
        <textarea
          rows={6}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste article body or enter news story URL..."
          className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono text-sm"
        />
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="self-start px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold flex items-center gap-2 transition disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {loading ? 'Evaluating Knowledge Graph...' : 'Analyze Credibility'}
        </button>
      </form>

      {error && (
        <div className="mt-6 p-4 rounded-xl border border-red-500/30 bg-red-950/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-8 bg-slate-900/70 border border-slate-800 rounded-2xl p-8 flex flex-col gap-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-800 pb-8">
            <div className="flex items-center gap-6">
              <ScoreRing score={result.score} label="Trust" />
              <div>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  result.risk === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'
                }`}>
                  {result.risk} Credibility Risk
                </span>
                <p className="text-sm text-slate-400 mt-2">Confidence: <span className="text-white font-medium">{result.confidence}%</span></p>
                <div className="flex gap-2 mt-2">
                  {result.modelsUsed.map(m => (
                    <span key={m} className="text-[11px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded">{m}</span>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-slate-300 text-sm max-w-md">{result.explanation}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Suspicious Claims Flagged
            </h3>
            <div className="space-y-2">
              {result.suspiciousClaims.map((claim, idx) => (
                <div key={idx} className="p-3 bg-red-950/20 border border-red-900/40 rounded-lg text-sm text-red-300">
                  {claim}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-cyan-400" /> Source Cross-Verification
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {result.sources.map((src, idx) => (
                <div key={idx} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col justify-between gap-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm text-slate-200">{src.domain}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Stance:</span>
                    <span className={`font-semibold capitalize ${src.stance === 'contradicts' ? 'text-red-400' : 'text-green-400'}`}>{src.stance}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Trust:</span>
                    <span className="text-slate-300 font-mono">{src.trustScore}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
