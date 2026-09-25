import { BrainCircuit, Shield, Info } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16 flex flex-col gap-12">
      <section className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-white">About TruthLens AI</h1>
        <p className="mt-4 text-slate-400 leading-relaxed">
          TruthLens is a student-friendly prototype for investigating suspicious online content. It focuses on transparent signals instead of presenting an unexplained “AI says fake” verdict.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-7 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <BrainCircuit className="w-8 h-8 text-cyan-400 mb-4" />
          <h3 className="text-xl font-bold text-white">Image screening</h3>
          <p className="text-slate-400 text-sm mt-2 leading-relaxed">Uses basic image statistics to surface unusual texture, edge and exposure patterns.</p>
        </div>
        <div className="p-7 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <Shield className="w-8 h-8 text-indigo-400 mb-4" />
          <h3 className="text-xl font-bold text-white">Responsible output</h3>
          <p className="text-slate-400 text-sm mt-2 leading-relaxed">Results explicitly state uncertainty and do not claim that a heuristic proves an image or article is fake.</p>
        </div>
        <div className="p-7 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <Info className="w-8 h-8 text-teal-400 mb-4" />
          <h3 className="text-xl font-bold text-white">Real-world workflow</h3>
          <p className="text-slate-400 text-sm mt-2 leading-relaxed">Users can submit text, article URLs and images, then review evidence before deciding what to trust.</p>
        </div>
      </section>

      <section className="p-8 rounded-2xl border border-amber-500/20 bg-amber-950/10">
        <h2 className="text-xl font-bold text-amber-200">Important limitation</h2>
        <p className="text-sm text-amber-100/70 mt-2 leading-relaxed">
          The included backend is a working prototype, not a production-trained deepfake or fact-checking model. For a competition or production deployment, the next upgrade is to connect a validated vision classifier and a claim-verification service with citations to primary sources.
        </p>
      </section>
    </div>
  );
}
