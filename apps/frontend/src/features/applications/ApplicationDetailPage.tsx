import { useState } from 'react'
import { ArrowLeft, Copy, RotateCw, Save, Trash2 } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { deleteApplication, rotateDsn, updateApplication } from './application-api'
import type { Application } from './application-api'

export function ApplicationDetailPage({
  application: initial,
  onBack,
  onChanged,
  onDeleted,
}: {
  application: Application
  onBack: () => void
  onChanged: (application: Application) => void
  onDeleted: () => void
}) {
  const [application, setApplication] = useState(initial)
  const [name, setName] = useState(initial.name)
  const [description, setDescription] = useState(initial.description ?? '')
  const [message, setMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  async function save() {
    setSaving(true)
    setMessage(null)
    try {
      const next = await updateApplication(application.id, { name, description })
      setApplication(next)
      onChanged(next)
      setMessage('应用信息已保存')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }
  async function rotate() {
    if (!window.confirm('旋转后旧 DSN 会立即失效，确定继续吗？')) return
    const next = await rotateDsn(application.id)
    setApplication(next)
    onChanged(next)
    setMessage('DSN 已旋转，请更新业务项目配置')
  }
  async function remove() {
    if (!window.confirm(`确定删除 ${application.name} / ${application.environment} 吗？`)) return
    await deleteApplication(application.id)
    onDeleted()
  }
  return (
    <section className="min-h-screen bg-[#0b1020] p-5 text-white sm:p-8">
      <div className="mx-auto max-w-[1044px]">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-[#9ba8cc] hover:text-white">
          <ArrowLeft size={16} />
          应用管理
        </button>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">{application.name}</h1>
            <p className="mt-2 text-sm text-[#9ba8cc]">
              {application.description || '暂无描述'} · {application.environment}
            </p>
          </div>
          <span className="rounded-lg bg-[#153b4a] px-3 py-2 font-mono text-xs text-[#4ade80]">
            ● {application.status}
          </span>
        </div>
        <div className="mt-6 grid gap-4 rounded-xl border border-[#2b3a68] bg-[#151e38] p-5 sm:grid-cols-3">
          <Meta label="slug" value={application.slug} />
          <Meta label="applicationId" value={application.id} />
          <Meta label="environment" value={application.environment} />
          <Meta label="public key" value={application.publicKey} />
          <Meta label="创建时间" value={new Date(application.createdAt).toLocaleString()} />
          <Meta label="更新时间" value={new Date(application.updatedAt).toLocaleString()} />
        </div>
        <div className="mt-5 rounded-xl border border-[#2b3a68] bg-[#151e38] p-5">
          <h2 className="font-medium">应用信息</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-xs text-[#9ba8cc]">
              应用名称
              <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-2" />
            </label>
            <label className="text-xs text-[#9ba8cc]">
              应用描述
              <Input value={description} onChange={(e) => setDescription(e.target.value)} className="mt-2" />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={() => void save()} disabled={saving}>
              <Save size={15} />
              {saving ? '保存中…' : '保存修改'}
            </Button>
            <Button variant="outline" onClick={() => void rotate()}>
              <RotateCw size={15} />
              旋转 DSN
            </Button>
            <Button
              variant="outline"
              className="border-red-400/30 text-red-200"
              onClick={() => void remove()}
            >
              <Trash2 size={15} />
              删除应用
            </Button>
          </div>
          {message && <p className="mt-4 text-xs text-[#75e3f5]">{message}</p>}
        </div>
        <div className="mt-5 rounded-xl border border-[#2b3a68] bg-[#151e38] p-5">
          <h2 className="font-medium">SDK 接入配置</h2>
          <p className="mt-2 text-xs text-[#9ba8cc]">DSN 用于让 SDK 将事件发送到指定应用和环境。</p>
          <div className="mt-4 flex items-center gap-3 rounded-lg bg-[#10182f] p-4">
            <code className="min-w-0 flex-1 truncate text-xs text-[#75e3f5]">{application.dsn}</code>
            <Button
              variant="ghost"
              className="h-8 px-2"
              onClick={() => void navigator.clipboard.writeText(application.dsn)}
            >
              <Copy size={14} />
              复制
            </Button>
          </div>
          <pre className="mt-4 overflow-x-auto rounded-lg bg-[#0a0f1f] p-4 text-xs leading-6 text-[#c9d5f2]">{`import { initBrowserMonitoring } from '@trace-kit/browser'\n\ninitBrowserMonitoring({\n  dsn: '${application.dsn}',\n  environment: '${application.environment}',\n})`}</pre>
        </div>
      </div>
    </section>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] text-[#7f8db2]">{label}</p>
      <p className="mt-1 truncate text-sm text-[#dce3ff]">{value}</p>
    </div>
  )
}
