import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LoginCard } from '../features/auth/LoginCard'
import { login, register } from '../features/auth/auth-api'
import { DashboardPage } from '../features/dashboard/DashboardPage'
import { BrandPanel } from '../features/overview/BrandPanel'
import { AppLayout } from './layouts/AppLayout'

export function App() {
  const [authenticated, setAuthenticated] = useState(
    Boolean(localStorage.getItem('tracekit.accessToken') ?? sessionStorage.getItem('tracekit.accessToken'))
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function submit(username: string, password: string, remember: boolean, mode: 'login' | 'register') {
    setSubmitting(true)
    setError(null)
    try {
      const result = mode === 'login' ? await login(username, password) : await register(username, password)
      const storage = remember ? localStorage : sessionStorage
      storage.setItem('tracekit.accessToken', result.accessToken)
      storage.setItem('tracekit.refreshToken', result.refreshToken)
      storage.setItem('tracekit.user', JSON.stringify(result.user))
      setAuthenticated(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '操作失败')
    } finally {
      setSubmitting(false)
    }
  }
  const logout = () => {
    localStorage.clear()
    sessionStorage.clear()
    setAuthenticated(false)
  }
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            authenticated ? (
              <Navigate to="/app/overview" replace />
            ) : (
              <LoginView submitting={submitting} error={error} onSubmit={submit} />
            )
          }
        />
        <Route path="/app" element={authenticated ? <AppLayout /> : <Navigate to="/" replace />}>
          <Route path="*" element={<DashboardPage onLogout={logout} />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

function LoginView({
  submitting,
  error,
  onSubmit,
}: {
  submitting: boolean
  error: string | null
  onSubmit: Parameters<typeof LoginCard>[0]['onSubmit']
}) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#0b1227] text-white">
      <div className="relative mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row">
        <BrandPanel />
        <section className="relative flex flex-1 items-center justify-center px-6 py-16 sm:px-10 lg:max-w-[560px] lg:px-16 lg:py-10 xl:max-w-[620px] xl:px-24">
          <LoginCard submitting={submitting} error={error} onSubmit={onSubmit} />
        </section>
      </div>
    </main>
  )
}
