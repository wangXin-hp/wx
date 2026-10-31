import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost'
}

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 disabled:pointer-events-none disabled:opacity-50',
        variant === 'primary' &&
          'bg-gradient-to-r from-violet-600 to-[#7856f8] text-white shadow-lg shadow-violet-600/20 hover:brightness-110 active:scale-[.99]',
        variant === 'outline' &&
          'border border-indigo-200/20 bg-white/[0.02] text-slate-200 hover:border-indigo-200/35 hover:bg-white/[0.05]',
        variant === 'ghost' && 'text-slate-400 hover:text-slate-200',
        className
      )}
      {...props}
    />
  )
}
