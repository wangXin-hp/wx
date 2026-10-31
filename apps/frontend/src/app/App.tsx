import { useState } from 'react'
import { LoginCard } from '../features/auth/LoginCard'
import { login, register } from '../features/auth/auth-api'
import { DashboardPage } from '../features/dashboard/DashboardPage'
import { BrandPanel } from '../features/overview/BrandPanel'

export function App() {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  async function handleLogin(
    username: string,
    password: string,
    remember: boolean,
    mode: 'login' | 'register'
  ) {
    setSubmitting(true)
    setLoginError(null)
    try {
      const result = mode === 'login' ? await login(username, password) : await register(username, password)
      const storage = remember ? localStorage : sessionStorage
      storage.setItem('tracekit.accessToken', result.accessToken)
      storage.setItem('tracekit.refreshToken', result.refreshToken)
      storage.setItem('tracekit.user', JSON.stringify(result.user))
      setSubmitted(true)
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : '登录失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <DashboardPage
        onLogout={() => {
          localStorage.removeItem('tracekit.accessToken')
          localStorage.removeItem('tracekit.refreshToken')
          localStorage.removeItem('tracekit.user')
          sessionStorage.removeItem('tracekit.accessToken')
          sessionStorage.removeItem('tracekit.refreshToken')
          sessionStorage.removeItem('tracekit.user')
          setSubmitted(false)
        }}
      />
    )
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#0b1227] text-white selection:bg-violet-400/30">
      <div className="relative mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row">
        <BrandPanel />
        <section className="relative flex flex-1 items-center justify-center px-6 py-16 sm:px-10 lg:max-w-[560px] lg:px-16 lg:py-10 xl:max-w-[620px] xl:px-24">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(103,67,255,.14),transparent_48%)]" />
          <LoginCard submitting={submitting} error={loginError} onSubmit={handleLogin} />
        </section>
      </div>
    </main>
  )
}
