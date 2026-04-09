'use client';

import { useState } from 'react';
import Link from 'next/link';
import { registerAction } from '@/app/actions/auth.actions';
import { Loader2, UserPlus, BrainCircuit } from 'lucide-react';

export default function RegisterPage() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const result = await registerAction(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 selection:bg-violet-500/30">
      <Link href="/" className="mb-8 flex items-center gap-2 text-violet-400 hover:text-violet-300 transition-colors">
        <BrainCircuit className="w-8 h-8" />
        <span className="text-xl font-black tracking-tight text-white">Chess Openings</span>
      </Link>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl shadow-black/50">
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Create Account</h1>
        <p className="text-slate-400 mb-8">Join Master Gambito and elevate your chess openings.</p>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">Name</label>
            <input
              name="name"
              type="text"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
              placeholder="Garry Kasparov"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">Email Address</label>
            <input
              name="email"
              type="email"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">Password</label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 flex items-center justify-center gap-2 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/25 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
            {!isLoading && <UserPlus className="w-5 h-5" />}
          </button>
        </form>

        <p className="text-center mt-8 text-slate-400 text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-violet-400 font-bold hover:underline underline-offset-4">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
