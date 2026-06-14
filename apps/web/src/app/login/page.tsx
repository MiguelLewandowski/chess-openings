'use client';

import { useState } from 'react';
import Link from 'next/link';
import { loginAction } from '@/app/actions/auth.actions';
import { Loader2, ArrowRight, BrainCircuit } from 'lucide-react';

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'Informe um e-mail válido.';
}

function validatePassword(password: string) {
  return password.length > 0 ? '' : 'A senha é obrigatória.';
}

export default function LoginPage() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });

  const handleBlur = (field: 'email' | 'password', value: string) => {
    const err = field === 'email' ? validateEmail(value) : validatePassword(value);
    setFieldErrors(prev => ({ ...prev, [field]: err }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);
    if (emailErr || passErr) {
      setFieldErrors({ email: emailErr, password: passErr });
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await loginAction(formData);
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
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Bem-vindo de volta</h1>
        <p className="text-slate-400 mb-8">Entre na sua conta para continuar seu treino.</p>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">E-mail</label>
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
            <label className="block text-sm font-bold text-slate-300 mb-2">Senha</label>
            <input
              name="password"
              type="password"
              required
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
            className="w-full mt-4 flex items-center justify-center gap-2 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold shadow-lg shadow-violet-500/25 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar'}
            {!isLoading && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>

        <p className="text-center mt-8 text-slate-400 text-sm">
          Não tem uma conta?{' '}
          <Link href="/register" className="text-violet-400 font-bold hover:underline underline-offset-4">
            Crie uma
          </Link>
        </p>
      </div>
    </div>
  );
}
