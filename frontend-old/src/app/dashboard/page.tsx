'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ScoreRing from '@/components/ScoreRing';
import { getHistory, HistoryEntry } from '@/lib/detection';
import { FileCheck, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  useEffect(() => setEntries(getHistory()), []);

  const flagged = entries.filter(e => e.risk === 'high').length;
  const avgConfidence = entries.length ? Math.round(entries.reduce((a, e) => a + e.confidence, 0) / entries.length) : 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Your Detection Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Live statistics from scans saved in this browser.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          [FileCheck, String(entries.length), 'Scans saved'],
          [AlertCircle, String(flagged), 'High-risk screenings'],
          [CheckCircle2, `${avgConfidence}%`, 'Average confidence'],
        ].map(([Icon, value, label]: any) => (
          <div key={label} className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400"><Icon className="w-6 h-6" /></div>
            <div><div className="text-2xl font-bold text-white">{value}</div><div className="text-xs text-slate-400">{label}</div></div>
          </div>
        ))}
      </div>

      {entries.length === 0 ? (
        <div className="p-10 border border-dashed border-slate-800 rounded-2xl text-center">
          <h2 className="text-xl font-bold text-white">Start your first investigation</h2>
          <p className="text-sm text-slate-400 mt-2">Run an image or article scan and the result will appear here.</p>
          <div className="flex justify-center gap-3 mt-5">
            <Link href="/fake-news-detector" className="px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 font-semibold">Check news</Link>
            <Link href="/deepfake-detector" className="px-4 py-2 rounded-lg bg-slate-800 text-white">Inspect image</Link>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-6">Recent scans</h3>
          <div className="space-y-4">
            {entries.slice(0, 8).map(item => (
              <div key={item.id} className="p-5 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0"><ScoreRing score={item.score} size={54} stroke={5} /><div className="min-w-0"><div className="text-sm font-semibold text-slate-200 truncate">{item.target}</div><div className="text-xs text-slate-500 mt-1">{item.type} · {item.timestamp}</div></div></div>
                <span className="text-xs uppercase font-bold text-slate-400">{item.risk}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
