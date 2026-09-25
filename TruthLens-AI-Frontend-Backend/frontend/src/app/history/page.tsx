'use client';
import { useEffect, useState } from 'react';
import { getHistory, clearHistory, HistoryEntry } from '@/lib/detection';
import ScoreRing from '@/components/ScoreRing';
import { Search, ChevronDown, Trash2 } from 'lucide-react';

export default function HistoryPage() {
  const [filter, setFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => setEntries(getHistory()), []);

  const filtered = entries.filter((item) =>
    `${item.target} ${item.type} ${item.id}`.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Detection History</h1>
          <p className="text-slate-400 text-sm mt-1">Your successful scans are stored locally in this browser.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input type="text" placeholder="Search scans..." value={filter} onChange={(e) => setFilter(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500" />
          </div>
          {entries.length > 0 && (
            <button onClick={() => { clearHistory(); setEntries([]); }} className="px-3 py-2 rounded-xl border border-red-900/50 text-red-400 hover:bg-red-950/30">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-10 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500">
          No scans yet. Run the Fake News or Deepfake detector to create history.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((entry) => {
            const isExpanded = expandedId === entry.id;
            return (
              <div key={entry.id} className="border border-slate-800 bg-slate-900/60 rounded-xl overflow-hidden">
                <div onClick={() => setExpandedId(isExpanded ? null : entry.id)} className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-800/30">
                  <div className="flex items-center gap-4 min-w-0">
                    <ScoreRing score={entry.score} size={54} stroke={5} />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-100 truncate">{entry.target}</div>
                      <div className="flex gap-2 text-xs text-slate-400 mt-1"><span className="text-cyan-400">{entry.type}</span><span>•</span><span>{entry.timestamp}</span></div>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
                {isExpanded && <div className="px-6 pb-6 pt-2 border-t border-slate-800 text-sm">
                  <p className="text-slate-300">{entry.explanation}</p>
                  <p className="text-xs text-slate-500 mt-3">Top signal: <span className="text-slate-300">{entry.topFlag}</span> · Confidence: {entry.confidence}%</p>
                  <div className="flex gap-2 mt-3 flex-wrap">{entry.modelsUsed.map(m => <span key={m} className="text-[11px] bg-slate-800 text-slate-300 px-2 py-1 rounded">{m}</span>)}</div>
                </div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
