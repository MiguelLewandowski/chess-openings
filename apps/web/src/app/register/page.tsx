'use client';

import { useState } from 'react';
import Link from 'next/link';
import { registerAction } from '@/app/actions/auth.actions';
import { Loader2, UserPlus, BrainCircuit } from 'lucide-react';

function validateName(name: string) {
  return name.trim().length > 0 ? '' : 'Name is required.';
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'Enter a valid email address.';
}

function validatePassword(password: string) {
  return password.length >= 6 ? '' : 'Password must be at least 6 characters.';
}

export default function RegisterPage() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ name: '', email: '', password: '' });

  const handleBlur = (field: 'name' | 'email' | 'password', value: string) => {
    let err = '';
    if (field === 'name') err = validateName(value);
    else if (field === 'email') err = validateEmail(value);
    else err = validatePassword(value);
    setFieldErrors(prev => ({ ...prev, [field]: err }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const nameErr = validateName(name);
    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);
    if (nameErr || emailErr || passErr) {
      setFieldErrors({ name: nameErr, email: emailErr, password: passErr });
      return;
    }

    setIsLoading(true);
    setError('');

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
              onBlur={e => handleBlur('name', e.target.value)}
              onChange={e => fieldErrors.name && handleBlur('name', e.target.value)}
              className={`w-full bg-slate-950 border rounded-xl p-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all ${
                fieldErrors.name ? 'border-rose-500' : 'border-slate-800'
              }`}
              placeholder="Garry Kasparov"
            />
            {fieldErrors.name && (
              <p className="mt-1.5 text-xs text-rose-400 font-medium">{fieldErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">Email Address</label>
            <input
              name="email"
              type="email"
              required
              onBlur={e => handleBlur('email', e.target.value)}
              onChange={e => fieldErrors.email && handleBlur('email', e.target.value)}
              className={`w-full bg-slate-950 border rounded-xl p-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all ${
                fieldErrors.email ? 'border-rose-500' : 'border-slate-800'
              }`}
              placeholder="you@example.com"
            />
            {fieldErrors.email && (
              <p className="mt-1.5 text-xs text-rose-400 font-medium">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">Password</label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              onBlur={e => handleBlur('password', e.target.value)}
              onChange={e => fieldErrors.password && handleBlur('password', e.target.value)}
              className={`w-full bg-slate-950 border rounded-xl p-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all ${
                fieldErrors.password ? 'border-rose-500' : 'border-slate-800'
              }`}
              placeholder="••••••••"
            />
            {fieldErrors.password && (
              <p className="mt-1.5 text-xs text-rose-400 font-medium">{fieldErrors.password}</p>
            )}
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
