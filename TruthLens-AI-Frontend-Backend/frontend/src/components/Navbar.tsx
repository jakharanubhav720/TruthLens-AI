'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, Layers, Image as ImageIcon, FileText, History, Info, LogIn } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Home', icon: ShieldCheck },
    { href: '/fake-news-detector', label: 'Fake News', icon: FileText },
    { href: '/deepfake-detector', label: 'Deepfake Image', icon: ImageIcon },
    { href: '/dashboard', label: 'Dashboard', icon: Layers },
    { href: '/history', label: 'History', icon: History },
    { href: '/about', label: 'About', icon: Info },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#070a0f]/90 backdrop-blur-md px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20">
            TL
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            TruthLens<span className="text-cyan-400">AI</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
          {links.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </div>

        <Link
          href="/login"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-medium text-slate-200 border border-slate-700 transition-colors"
        >
          <LogIn className="w-4 h-4" />
          <span>Sign In</span>
        </Link>
      </div>
    </nav>
  );
}
