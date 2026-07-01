'use client';

import { useState } from 'react';
import Link from 'next/link';
import { loginAction } from '@/app/actions/auth.actions';
import { Loader2, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen bg-surface-app flex flex-col items-center justify-center p-6">
      <Link href="/" className="mb-8 flex items-center gap-2.5 no-underline hover:no-underline">
        <div className="w-8 h-8 bg-ink-900 rounded-[9px] flex items-center justify-center text-[20px]">♞</div>
        <span className="font-display font-extrabold text-[17px] tracking-tight text-ink-900">Chess Openings</span>
      </Link>

      <div className="bg-surface-card border border-border-default rounded-[16px] p-8 max-w-md w-full shadow-lg">
        <h1 className="font-display font-extrabold text-[28px] tracking-tight text-ink-900 mb-1">Bem-vindo de volta</h1>
        <p className="text-ink-500 text-[14px] mb-7">Entre na sua conta para continuar seu treino.</p>

        {error && (
          <div className="bg-danger-soft border border-[#E0483D]/20 text-danger text-[13px] font-medium p-3.5 rounded-[8px] mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-semibold text-ink-700 mb-1.5">E-mail</label>
            <input
              name="email"
              type="email"
              required
              onBlur={e => handleBlur('email', e.target.value)}
              onChange={e => fieldErrors.email && handleBlur('email', e.target.value)}
              className={`w-full bg-surface-app border rounded-[8px] px-4 h-10 text-[14px] text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all ${
                fieldErrors.email ? 'border-danger' : 'border-border-default'
              }`}
              placeholder="voce@exemplo.com"
            />
            {fieldErrors.email && (
              <p className="mt-1 text-[12px] text-danger font-medium">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-ink-700 mb-1.5">Senha</label>
            <input
              name="password"
              type="password"
              required
              onBlur={e => handleBlur('password', e.target.value)}
              onChange={e => fieldErrors.password && handleBlur('password', e.target.value)}
              className={`w-full bg-surface-app border rounded-[8px] px-4 h-10 text-[14px] text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all ${
                fieldErrors.password ? 'border-danger' : 'border-border-default'
              }`}
              placeholder="••••••••"
            />
            {fieldErrors.password && (
              <p className="mt-1 text-[12px] text-danger font-medium">{fieldErrors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 h-10 flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white rounded-[8px] text-[14px] font-semibold transition-all active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Entrar <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <p className="text-center mt-6 text-ink-500 text-[13px]">
          Não tem uma conta?{' '}
          <Link href="/register" className="text-accent font-semibold hover:underline underline-offset-4">
            Crie uma
          </Link>
        </p>
      </div>
    </div>
  );
}
