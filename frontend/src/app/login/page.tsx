'use client';
import { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-md mx-auto px-6 py-20 w-full">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white">{isSignup ? 'Create Account' : 'Welcome Back'}</h2>
          <p className="text-xs text-slate-400 mt-1">Access higher batch analysis limits and custom API tokens.</p>
        </div>

        {submitted ? (
          <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-center">
            <p className="text-sm font-semibold text-cyan-300">Demo session created</p>
            <p className="text-xs text-slate-400 mt-1">This prototype does not connect to a real authentication provider yet.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="analyst@domain.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition"
            >
              {isSignup ? 'Register New Account' : 'Authenticate Session'}
            </button>
          </form>
        )}

        <div className="text-center mt-6 text-xs text-slate-500">
          {isSignup ? 'Already registered?' : "Don't have an account?"}{' '}
          <button
            onClick={() => { setIsSignup(!isSignup); setSubmitted(false); }}
            className="text-cyan-400 hover:underline font-medium"
          >
            {isSignup ? 'Log in here' : 'Sign up'}
          </button>
        </div>
      </div>
    </div>
  );
}
