import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-[#05070a] py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-cyan-500 text-xs font-bold flex items-center justify-center text-black">TL</div>
            <span className="font-semibold text-slate-200">TruthLens AI</span>
          </div>
          <p className="text-xs text-slate-500">Clinical-grade automated verification against synthetic media and disinformation.</p>
        </div>
        <div className="flex gap-6 text-sm text-slate-400">
          <Link href="/about" className="hover:text-cyan-400 transition">About</Link>
          <Link href="/fake-news-detector" className="hover:text-cyan-400 transition">News Verification</Link>
          <Link href="/deepfake-detector" className="hover:text-cyan-400 transition">Image Analysis</Link>
          <Link href="/dashboard" className="hover:text-cyan-400 transition">Dashboard</Link>
        </div>
        <div className="text-xs text-slate-600">
          &copy; {new Date().getFullYear()} TruthLens AI. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
