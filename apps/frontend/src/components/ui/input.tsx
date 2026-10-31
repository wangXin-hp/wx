import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-12 w-full rounded-xl border border-indigo-200/20 bg-[#0e1731] px-4 text-[13px] text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/70 focus:ring-2 focus:ring-violet-400/15',
        className
      )}
      {...props}
    />
  )
}
