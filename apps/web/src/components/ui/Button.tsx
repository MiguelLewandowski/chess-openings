import { cn } from '@/lib/cn'
import type { ButtonHTMLAttributes } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-[120ms] active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none rounded-[8px]'

const variants: Record<ButtonVariant, string> = {
  primary:   'bg-accent text-white hover:bg-accent-hover shadow-sm',
  secondary: 'bg-surface-card text-ink-700 border border-border-default hover:border-border-strong hover:bg-surface-raised shadow-sm',
  success:   'bg-success text-white hover:bg-[#21824A] shadow-sm',
  danger:    'bg-danger text-white hover:bg-[#C53A30] shadow-sm',
  warning:   'bg-warning text-ink-900 hover:bg-[#C77F0E] shadow-sm',
  ghost:     'bg-transparent text-ink-600 hover:bg-surface-sunken hover:text-ink-900',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-10 px-5 text-[14px]',
  lg: 'h-12 px-7 text-[15px]',
}

export function buttonClasses(
  { variant = 'primary', size = 'md', className }: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {},
): string {
  return cn(base, variants[variant], sizes[size], className)
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return <button className={buttonClasses({ variant, size, className })} {...props} />
}
