'use client';
import { useState } from 'react';
import { analyzeDeepfakeImage, DeepfakeResult, saveHistory } from '@/lib/detection';
import ScoreRing from '@/components/ScoreRing';
import { UploadCloud, Loader2, Sparkles, Sliders, ShieldCheck, AlertTriangle, HelpCircle } from 'lucide-react';

export default function DeepfakeDetectorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DeepfakeResult | null>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const data = await analyzeDeepfakeImage(file);
      setResult(data);
      saveHistory({
        id: `TL-${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        type: 'Image Forensics',
        target: file.name,
        score: data.score,
        risk: data.risk,
        confidence: data.confidence,
        topFlag: data.signals.sort((a, b) => b.score - a.score)[0]?.name || 'General image statistics',
        explanation: data.explanation,
        modelsUsed: data.modelsUsed
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image analysis failed. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">AI Deepfake Image Detector</h1>
        <p className="text-slate-400 text-sm mt-1">Screen an image with Reality Defender deepfake detection.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const dropped = e.dataTransfer.files?.[0]; if (dropped) { setFile(dropped); setPreview(URL.createObjectURL(dropped)); setResult(null); } }} className="border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-900/40 rounded-2xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[300px]">
          {preview ? (
            <div className="w-full flex flex-col items-center gap-4">
              <img src={preview} alt="Upload preview" className="max-h-56 rounded-lg object-contain border border-slate-700 shadow-md" />
              <button
                onClick={() => { setFile(null); setPreview(null); setResult(null); }}
                className="text-xs text-red-400 hover:underline"
              >
                Remove image
              </button>
            </div>
          ) : (
            <label className="cursor-pointer flex flex-col items-center gap-3">
              <UploadCloud className="w-12 h-12 text-slate-500" />
              <span className="text-slate-300 font-semibold text-sm">Click to browse or drop an image</span>
              <span className="text-slate-500 text-xs">JPG, PNG, WEBP • Max 4MB • drag & drop supported</span>
              <input type="file" accept="image/png, image/jpeg" onChange={handleFileChange} className="hidden" />
            </label>
          )}
        </div>

        <div className="flex flex-col justify-center gap-4 p-6 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <h3 className="text-lg font-bold text-white">Reality Defender Image Inspection</h3>
          <p className="text-slate-400 text-sm">
            Reality Defender analyzes the image for signals associated with manipulated or synthetic media. Results are screening signals, not proof.
          </p>
          <button
            onClick={handleAnalyze}
            disabled={!file || loading}
            className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Analyzing with Reality Defender...' : 'Scan Image Now'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-6 p-4 rounded-xl border border-red-500/30 bg-red-950/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-12 bg-slate-900/80 border border-slate-800 rounded-2xl p-8 flex flex-col gap-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-800 pb-8">
            <div className="flex items-center gap-6">
              <ScoreRing score={result.fakeProbability} label="AI %" />
              <div>
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  result.prediction === 'Likely AI-generated' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                  result.prediction === 'Likely authentic' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                  'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {result.prediction === 'Likely AI-generated' ? <AlertTriangle className="w-3.5 h-3.5" /> : result.prediction === 'Likely authentic' ? <ShieldCheck className="w-3.5 h-3.5" /> : <HelpCircle className="w-3.5 h-3.5" />}
                  {result.prediction}
                </span>
                <p className="text-sm text-slate-400 mt-2">Result confidence: <span className="text-white font-medium">{result.confidence}%</span></p>
              </div>
            </div>
            <p className="text-slate-300 text-sm max-w-md">{result.explanation}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" /> Model Signal Breakdown
            </h3>
            <div className="space-y-4">
              {result.signals.map((sig, idx) => (
                <div key={idx} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col gap-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-slate-300">{sig.name}</span>
                    <span className="font-mono text-cyan-400">{sig.score}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-cyan-500 h-full rounded-full transition-all duration-700" style={{ width: `${sig.score}%` }} />
                  </div>
                  <p className="text-xs text-slate-500">{sig.description}</p>
                </div>
              ))}
            </div>
          </div>

          {result.verification && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Independent verification</h3>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  result.verification.mode === 'cross_checked'
                    ? result.verification.agreement === 'agree' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {result.verification.mode === 'cross_checked' ? (result.verification.agreement === 'agree' ? 'Models agree' : 'Models disagree') : result.verification.mode === 'external_only' ? 'Reality Defender' : 'Local model only'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                  <p className="text-xs uppercase tracking-wider text-slate-500">Detection provider</p>
                  <p className="text-sm font-semibold text-white mt-1">Reality Defender</p>
                  <p className="text-xs text-slate-500 mt-1">External deepfake detection service</p>
                </div>
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                  <p className="text-xs uppercase tracking-wider text-slate-500">Reality Defender</p>
                  {result.verification.external?.status === 'complete' ? (
                    <>
                      <p className="text-sm font-semibold text-white mt-1">{result.verification.external.classification || 'Analysis complete'}</p>
                      <p className="text-xs text-slate-400 mt-1">Manipulation probability: {result.verification.external.score ?? '—'}%</p>
                    </>
                  ) : (
                    <p className="text-xs text-slate-500 mt-2">Not configured or temporarily unavailable.</p>
                  )}
                </div>
              </div>
              
            </div>
          )}

          {result.supportingDiagnostics && (
            <div>
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4">Supporting image diagnostics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {result.supportingDiagnostics.map((sig, idx) => (
                  <div key={idx} className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                    <p className="text-sm font-semibold text-slate-300">{sig.name}</p>
                    <p className="text-2xl font-bold text-cyan-400 mt-1">{sig.score}%</p>
                    <p className="text-xs text-slate-500 mt-2">{sig.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-xs text-slate-500">
            <strong className="text-slate-300">Important:</strong> no image detector is perfect. This result is a screening result from Reality Defender and should not be treated as proof of authenticity or manipulation.
          </div>
        </div>
      )}
    </div>
  );
}
// Vercel rebuild trigger
