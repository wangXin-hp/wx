import { useEffect, useState, type FormEvent } from 'react'
import { Copy, MoreHorizontal, Plus, RefreshCw, X } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { createApplication, listApplications } from './application-api'
import type { Application } from './application-api'
import { ApplicationDetailPage } from './ApplicationDetailPage'

export function ApplicationManagementPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Application | null>(null)
  async function load() {
    setLoading(true)
    setError(null)
    try {
      setApplications(await listApplications())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '应用加载失败')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    void load()
  }, [])
  if (selected)
    return (
      <ApplicationDetailPage
        application={selected}
        onBack={() => setSelected(null)}
        onChanged={(next) => {
          setSelected(next)
          setApplications((items) => items.map((item) => (item.id === next.id ? next : item)))
        }}
        onDeleted={() => {
          setSelected(null)
          setApplications((items) => items.filter((item) => item.id !== selected.id))
        }}
      />
    )
  return (
    <section className="min-h-screen bg-[#0b1020] p-5 text-white sm:p-8">
      <div className="mx-auto max-w-[1106px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] text-[#75e3f5]">TRACEKIT · APPLICATIONS</p>
            <h1 className="mt-2 text-3xl font-semibold">应用管理</h1>
            <p className="mt-2 text-sm text-[#9ba8cc]">创建和管理你的监控应用及环境</p>
          </div>
          <Button className="h-10 px-4" onClick={() => setOpen(true)}>
            <Plus size={16} />
            创建应用
          </Button>
        </div>
        <p className="mt-6 rounded-lg border border-[#2b3a68] bg-[#151e38] px-4 py-3 font-mono text-[11px] text-[#8ea1c7]">
          同一 slug 可在不同 environment 创建；相同组合不可重复。不同 applicationId / DSN 保持隔离。
        </p>
        <div className="mt-5 overflow-x-auto rounded-xl border border-[#2b3a68] bg-[#151e38]">
          <div className="min-w-[980px]">
            <div className="grid grid-cols-[1.2fr_1.3fr_1.3fr_.7fr_1.5fr_1.4fr_40px] gap-4 border-b border-[#2b3a68] px-5 py-4 font-mono text-[10px] text-[#7f8db2]">
              <span>应用名称</span>
              <span>slug / environment</span>
              <span>description</span>
              <span>status</span>
              <span>public key</span>
              <span>DSN</span>
              <span />
            </div>
            {loading && <div className="p-8 text-center text-sm text-[#9ba8cc]">加载应用中…</div>}
            {error && (
              <div className="flex items-center justify-between p-5 text-sm text-red-200">
                <span>{error}</span>
                <Button variant="ghost" onClick={() => void load()}>
                  <RefreshCw size={14} />
                  重试
                </Button>
              </div>
            )}
            {!loading && !error && applications.length === 0 && (
              <div className="p-12 text-center">
                <p className="text-lg">还没有监控应用</p>
                <p className="mt-2 text-sm text-[#9ba8cc]">创建第一个应用后即可获得独立 DSN。</p>
              </div>
            )}
            {applications.map((app) => (
              <div
                key={app.id}
                className="grid grid-cols-[1.2fr_1.3fr_1.3fr_.7fr_1.5fr_1.4fr_40px] items-center gap-4 border-b border-[#223053] px-5 py-4 text-xs last:border-0"
              >
                <button
                  className="text-left font-medium text-[#dce3ff] hover:text-white"
                  onClick={() => setSelected(app)}
                >
                  {app.name}
                </button>
                <span className="text-[#b8c3ea]">
                  {app.slug}
                  <br />
                  <span className="font-mono text-[10px] text-[#75e3f5]">{app.environment}</span>
                </span>
                <span className="truncate text-[#9ba8cc]">{app.description || '—'}</span>
                <span className={app.status === 'active' ? 'text-[#4ade80]' : 'text-[#ffb454]'}>
                  {app.status}
                </span>
                <span className="font-mono text-[#b8c3ea]">{app.publicKey}</span>
                <button
                  className="flex items-center gap-1 truncate font-mono text-[10px] text-[#75e3f5]"
                  onClick={() => void navigator.clipboard.writeText(app.dsn)}
                >
                  <Copy size={12} />
                  {app.dsn}
                </button>
                <MoreHorizontal size={16} className="text-[#7f8db2]" />
              </div>
            ))}
          </div>
        </div>
      </div>
      {open && (
        <CreateApplicationModal
          onClose={() => setOpen(false)}
          onCreated={(app) => {
            setApplications((items) => [app, ...items])
            setOpen(false)
          }}
        />
      )}
    </section>
  )
}

function CreateApplicationModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (application: Application) => void
}) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [environment, setEnvironment] = useState<Application['environment']>('production')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      onCreated(await createApplication({ name, slug, environment, description }))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '创建应用失败')
    } finally {
      setSaving(false)
    }
  }
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#070b16aa] p-4">
      <form
        onSubmit={(event) => void submit(event)}
        className="w-full max-w-[620px] rounded-xl border border-[#2b3a68] bg-[#151e38] p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold">创建应用</h2>
            <p className="mt-2 text-sm text-[#9ba8cc]">
              新增一个受 applicationId + environment 隔离的监控应用
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-[#9ba8cc]">
            <X size={18} />
          </button>
        </div>
        <div className="mt-6 space-y-4">
          <label className="block text-xs text-[#9ba8cc]">
            应用名称
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-2" required />
          </label>
          <label className="block text-xs text-[#9ba8cc]">
            slug
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="mt-2"
              pattern="[a-z0-9-]+"
              required
            />
          </label>
          <label className="block text-xs text-[#9ba8cc]">
            应用描述
            <Input value={description} onChange={(e) => setDescription(e.target.value)} className="mt-2" />
          </label>
          <label className="block text-xs text-[#9ba8cc]">
            environment
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value as Application['environment'])}
              className="mt-2 h-12 w-full rounded-xl border border-indigo-200/20 bg-[#10182f] px-4 text-sm text-white outline-none"
            >
              <option>development</option>
              <option>staging</option>
              <option>production</option>
            </select>
          </label>
        </div>
        {error && <p className="mt-4 rounded-lg bg-red-400/10 px-3 py-2 text-xs text-red-200">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? '创建中…' : '创建应用'}
          </Button>
        </div>
      </form>
    </div>
  )
}
