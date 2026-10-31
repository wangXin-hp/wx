import { useState } from 'react'
import { Check, ChevronRight, Eye, EyeOff, LockKeyhole, UserRound } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'

interface LoginCardProps {
  submitting: boolean
  error: string | null
  onSubmit: (
    username: string,
    password: string,
    remember: boolean,
    mode: 'login' | 'register'
  ) => Promise<void>
}

export function LoginCard({ submitting, error, onSubmit }: LoginCardProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'register'>('login')

  return (
    <div className="relative w-full max-w-[420px] rounded-[22px] border border-white/[0.11] bg-[#151f3d]/95 p-7 shadow-2xl shadow-black/25 sm:p-9">
      <div className="mb-8">
        <h2 className="text-[30px] font-semibold tracking-[-0.035em]">欢迎回来</h2>
        <p className="mt-2 text-[13px] leading-6 text-slate-400">登录你的监控工作台，继续处理关键事件。</p>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void onSubmit(username, password, remember, mode)
        }}
        className="space-y-5"
      >
        <label className="block">
          <span className="mb-2 block text-[12px] font-medium text-slate-300">账号</span>
          <div className="relative">
            <UserRound
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300"
            />
            <Input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              type="text"
              required
              placeholder="请输入账号"
              className="pl-11"
            />
          </div>
        </label>
        <label className="block">
          <span className="mb-2 block text-[12px] font-medium text-slate-300">密码</span>
          <div className="relative">
            <LockKeyhole
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300"
            />
            <Input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="••••••••••••"
              className="pl-11 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
              aria-label={showPassword ? '隐藏密码' : '显示密码'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>
        <div className="flex items-center justify-between text-[12px]">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setRemember((value) => !value)}
            className="gap-2"
          >
            <span
              className={`grid h-4 w-4 place-items-center rounded-[4px] border transition ${remember ? 'border-violet-400 bg-violet-500 text-white' : 'border-slate-600 bg-transparent'}`}
            >
              {remember && <Check size={11} strokeWidth={3} />}
            </span>
            记住我
          </Button>
          <Button type="button" variant="ghost" className="text-violet-300 hover:text-violet-200">
            忘记密码？
          </Button>
        </div>
        {error && (
          <p
            role="alert"
            className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs text-red-200"
          >
            {error}
          </p>
        )}
        <Button type="submit" disabled={submitting} className="h-12 w-full">
          {submitting
            ? mode === 'login'
              ? '登录中…'
              : '注册中…'
            : mode === 'login'
              ? '登录工作台'
              : '创建账号'}
          <ChevronRight size={17} />
        </Button>
      </form>
      <div className="my-6 flex items-center gap-3 text-[11px] text-slate-600">
        <span className="h-px flex-1 bg-white/[0.08]" />或<span className="h-px flex-1 bg-white/[0.08]" />
      </div>
      <Button
        type="button"
        variant="outline"
        className="h-12 w-full"
        onClick={() => {
          setMode((value) => (value === 'login' ? 'register' : 'login'))
          setErrorSafe()
        }}
      >
        {mode === 'login' ? '注册账号' : '返回登录'}
      </Button>
      <p className="mt-6 text-center text-[10px] leading-5 text-slate-600">
        {mode === 'login' ? '登录即表示你同意我们的' : '注册即表示你同意我们的'}{' '}
        <button className="text-slate-400 hover:text-slate-300">服务条款</button> 与{' '}
        <button className="text-slate-400 hover:text-slate-300">隐私政策</button>
      </p>
    </div>
  )

  function setErrorSafe() {
    // 模式切换后由父组件清理上一次请求错误，避免把登录错误带到注册界面。
  }
}
