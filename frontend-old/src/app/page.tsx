import Link from 'next/link';
import { ShieldCheck, Cpu, Database, Eye, ArrowRight, Activity, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col gap-20 pb-20">
      <section className="pt-16 px-6 max-w-6xl mx-auto text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-6">
          <Activity className="w-3.5 h-3.5" /> AI-powered media verification
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white max-w-4xl leading-tight">
          Check suspicious <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">news and images</span> before you share them.
        </h1>
        <p className="mt-6 text-slate-400 text-lg md:text-xl max-w-2xl">
          TruthLens combines transparent image forensics and credibility screening to help users investigate potentially manipulated content.
        </p>
        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          <Link href="/fake-news-detector" className="px-6 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold flex items-center gap-2 transition">
            Check a News Claim <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/deepfake-detector" className="px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold border border-slate-700 transition">
            Inspect an Image
          </Link>
        </div>
        <p className="mt-4 text-xs text-slate-500">Screening tool — not a replacement for human or primary-source verification.</p>
      </section>

      <section className="max-w-7xl mx-auto px-6 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            [Eye, 'Image Forensics', 'Analyze texture, edge distribution, exposure and other image-level signals without pretending a heuristic is a trained detector.'],
            [Database, 'URL & Text Screening', 'Paste an article or URL. TruthLens extracts readable content and highlights language patterns that deserve verification.'],
            [Cpu, 'Explainable Results', 'Every result shows the signals used, confidence, limitations and what the user should verify next.'],
          ].map(([Icon, title, body]: any) => (
            <div key={title} className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400"><Icon className="w-6 h-6" /></div>
              <h3 className="text-xl font-bold text-slate-100">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 w-full">
        <h2 className="text-3xl font-bold text-white text-center mb-10">How the verification flow works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            ['01', 'Submit', 'Paste text / URL or upload an image.'],
            ['02', 'Analyze', 'The backend computes transparent screening signals.'],
            ['03', 'Investigate', 'Review the evidence and verify important claims with primary sources.'],
          ].map(([n, t, d]) => (
            <div key={n} className="p-6 rounded-xl border border-slate-800 bg-slate-950/40">
              <span className="text-cyan-400 font-mono text-sm font-bold">STEP {n}</span>
              <h4 className="text-lg font-semibold text-slate-200 mt-2">{t}</h4>
              <p className="text-slate-400 text-sm mt-2">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-800 bg-slate-900/30 py-12 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            ['Transparent', 'No random scores or fake accuracy claims'],
            ['Actionable', 'Shows why a result was flagged'],
            ['Responsible', 'Clearly states what the system cannot prove'],
          ].map(([title, desc]) => (
            <div key={title} className="flex gap-3 items-start">
              <CheckCircle2 className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
              <div><div className="font-semibold text-white">{title}</div><div className="text-xs text-slate-400 mt-1">{desc}</div></div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
