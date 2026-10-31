import { useEffect, useState } from 'react'
import {
  AlertCircle,
  BarChart3,
  ChevronDown,
  Gauge,
  LayoutDashboard,
  LogOut,
  Menu,
  RefreshCw,
  Settings,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { cn } from '../../lib/utils'
import { ApplicationManagementPage } from '../applications/ApplicationManagementPage'
import {
  getApplicationOverview,
  getApplicationTrends,
  listApplicationEvents,
  listApplications,
} from '../applications/application-api'
import type { Application, ApplicationOverview } from '../applications/application-api'

type NavItem = '总览' | '错误监控' | '性能监控' | '埋点分析' | '应用管理' | '应用设置'

export function DashboardPage({ onLogout }: { onLogout: () => void }) {
  const [activeNav, setActiveNav] = useState<NavItem>('总览')
  const [applications, setApplications] = useState<Application[]>([])
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [environment, setEnvironment] = useState('development')
  const [range, setRange] = useState('最近 7 天')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedError, setSelectedError] = useState<string | null>(null)
  const [overview, setOverview] = useState<ApplicationOverview | null>(null)
  const [trends, setTrends] = useState<Array<{ bucket: string; eventType: string; count: string }>>([])
  const [events, setEvents] = useState<Array<Record<string, unknown>>>([])
  const reloadOverview = () => {
    if (selectedApp)
      void getApplicationOverview(selectedApp.id, environment)
        .then(setOverview)
        .catch(() => setOverview(null))
  }
  useEffect(() => {
    void listApplications()
      .then((items) => {
        setApplications(items)
        setSelectedApp(items[0] ?? null)
        if (items[0]) setEnvironment(items[0].environment)
      })
      .catch(() => undefined)
  }, [])
  useEffect(() => {
    if (selectedApp)
      void getApplicationOverview(selectedApp.id, environment)
        .then(setOverview)
        .catch(() => setOverview(null))
  }, [selectedApp, environment])
  useEffect(() => {
    if (selectedApp)
      void listApplicationEvents(selectedApp.id, environment)
        .then(setEvents)
        .catch(() => setEvents([]))
  }, [selectedApp, environment])
  useEffect(() => {
    if (selectedApp)
      void getApplicationTrends(selectedApp.id, environment)
        .then(setTrends)
        .catch(() => setTrends([]))
  }, [selectedApp, environment])
  useEffect(() => {
    if (!selectedApp) return
    const timer = window.setInterval(() => {
      void getApplicationOverview(selectedApp.id, environment)
        .then(setOverview)
        .catch(() => undefined)
    }, 3000)
    return () => window.clearInterval(timer)
  }, [selectedApp, environment])

  return (
    <main className="min-h-screen bg-[#0b1020] text-white">
      <div className="flex min-h-screen">
        <button
          className="fixed left-4 top-4 z-30 rounded-lg border border-[#2b3a68] bg-[#151e38] p-2 text-[#dce3ff] lg:hidden"
          onClick={() => setSidebarOpen(true)}
          aria-label="打开导航"
        >
          <Menu size={20} />
        </button>
        {sidebarOpen && (
          <button
            className="fixed inset-0 z-20 bg-black/60 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="关闭导航遮罩"
          />
        )}
        <Sidebar
          application={selectedApp}
          activeNav={activeNav}
          open={sidebarOpen}
          onNavigate={(nav) => {
            setActiveNav(nav)
            setSidebarOpen(false)
          }}
          onLogout={onLogout}
        />
        <section className="min-w-0 flex-1 lg:ml-0">
          <Topbar
            application={selectedApp}
            applications={applications}
            onApplicationChange={(id) => setSelectedApp(applications.find((item) => item.id === id) ?? null)}
            environment={environment}
            range={range}
            onEnvironmentChange={setEnvironment}
            onRangeChange={setRange}
            onRefresh={reloadOverview}
          />
          {activeNav === '应用管理' ? (
            <ApplicationManagementPage />
          ) : activeNav === '总览' ? (
            <div className="mx-auto max-w-[1128px] space-y-5 px-4 pb-8 pt-16 sm:px-6 lg:px-8 lg:pt-8">
              <header>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#75e3f5]">
                  {selectedApp?.name ?? '暂无应用'} · {environment}
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-white">应用总览</h1>
                <p className="mt-2 text-sm text-[#9ba8cc]">查看当前应用的错误、性能和用户行为数据</p>
              </header>
              <Metrics overview={overview} />
              <ChartSection overview={overview} trends={trends} />
              <ErrorSummary overview={overview} onSelect={setSelectedError} />
            </div>
          ) : (
            <MonitorSection title={activeNav} overview={overview} application={selectedApp} events={events} />
          )}
        </section>
      </div>
      {selectedError && <ErrorDrawer error={selectedError} onClose={() => setSelectedError(null)} />}
    </main>
  )
}

function MonitorSection({
  title,
  overview,
  application,
  events,
}: {
  title: NavItem
  overview: ApplicationOverview | null
  application: Application | null
  events: Array<Record<string, unknown>>
}) {
  const copy: Record<NavItem, string> = {
    总览: '查看当前应用的错误、性能和用户行为数据',
    错误监控: '按应用和环境查看 SDK 上报的错误事件',
    性能监控: '查看 Web Vitals 和页面加载性能事件',
    埋点分析: '查看自定义埋点和业务行为事件',
    应用管理: '管理应用和 DSN',
    应用设置: '查看当前应用的接入信息和运行状态',
  }
  return (
    <div className="mx-auto max-w-[1128px] space-y-5 px-4 pb-8 pt-16 sm:px-6 lg:px-8 lg:pt-8">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#75e3f5]">
          {application?.name ?? '暂无应用'}
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">{title}</h1>
        <p className="mt-2 text-sm text-[#9ba8cc]">{copy[title]}</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ['事件总数', overview?.total ?? 0],
          ['错误事件', overview?.errors ?? 0],
          ['性能事件', overview?.performance ?? 0],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border border-[#2b3a68] bg-[#151e38] p-5">
            <p className="text-xs text-[#92a0c3]">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>
      {title === '应用设置' ? (
        <section className="rounded-xl border border-[#2b3a68] bg-[#151e38] p-5">
          <h2 className="font-medium text-white">应用接入信息</h2>
          <dl className="mt-4 space-y-3 text-sm text-[#b8c3ea]">
            <div>
              <dt className="text-xs text-[#7f8db2]">应用 ID</dt>
              <dd className="mt-1 font-mono">{application?.id ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-[#7f8db2]">DSN</dt>
              <dd className="mt-1 break-all font-mono text-[#75e3f5]">
                {application?.dsn ?? '请在应用管理中查看'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[#7f8db2]">状态</dt>
              <dd className="mt-1 text-[#4ade80]">{application?.status ?? '—'}</dd>
            </div>
          </dl>
        </section>
      ) : (
        <section className="rounded-xl border border-[#2b3a68] bg-[#151e38] p-5">
          <h2 className="font-medium text-white">最近事件</h2>
          <p className="mt-2 text-sm text-[#aab6d8]">数据按当前应用和环境实时查询。</p>
          <div className="mt-5 space-y-2">
            {events
              .filter((event) =>
                title === '错误监控'
                  ? event.eventType === 'error'
                  : title === '性能监控'
                    ? event.eventType === 'performance'
                    : title === '埋点分析'
                      ? event.eventType === 'custom'
                      : true
              )
              .slice(0, 20)
              .map((event, index) => (
                <div
                  key={String(event.eventId ?? index)}
                  className="rounded-lg border border-[#223053] bg-[#10182f] p-3 text-xs text-[#c6d0ed]"
                >
                  <span className="mr-3 font-mono text-[#75e3f5]">{String(event.eventType)}</span>
                  {String((event.payload as Record<string, unknown>)?.message ?? event.timestamp)}
                </div>
              ))}
          </div>
        </section>
      )}
    </div>
  )
}

function Sidebar({
  application,
  activeNav,
  open,
  onNavigate,
  onLogout,
}: {
  application: Application | null
  activeNav: NavItem
  open: boolean
  onNavigate: (nav: NavItem) => void
  onLogout: () => void
}) {
  const items: Array<{ label: NavItem; icon: typeof LayoutDashboard }> = [
    { label: '总览', icon: LayoutDashboard },
    { label: '错误监控', icon: AlertCircle },
    { label: '性能监控', icon: Gauge },
    { label: '埋点分析', icon: BarChart3 },
    { label: '应用管理', icon: SlidersHorizontal },
    { label: '应用设置', icon: Settings },
  ]
  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 flex w-60 -translate-x-full flex-col border-r border-[#202d52] bg-[#10182f] p-5 transition-transform lg:static lg:translate-x-0',
        open && 'translate-x-0'
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-lg font-semibold tracking-[0.18em] text-white">TRACEKIT</p>
          <p className="mt-1 text-[10px] text-[#8b9bc4]">浏览器监控平台</p>
        </div>
        <button
          className="text-[#8391b7] lg:hidden"
          onClick={() => onNavigate(activeNav)}
          aria-label="关闭导航"
        >
          <X size={18} />
        </button>
      </div>
      <div className="mt-7 rounded-xl border border-[#2b3a68] bg-[#17244a] p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-white">{application?.name ?? '暂无应用'}</span>
          <ChevronDown size={15} className="text-[#75e3f5]" />
        </div>
        <p className="mt-1 font-mono text-[10px] text-[#75e3f5]">development · staging · production</p>
      </div>
      <nav className="mt-6 space-y-1">
        {items.map(({ label, icon: Icon }) => (
          <button
            key={label}
            onClick={() => onNavigate(label)}
            className={cn(
              'flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm transition',
              activeNav === label
                ? 'bg-[#252a63] text-white'
                : 'text-[#aab6d8] hover:bg-[#182344] hover:text-white'
            )}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>
      <div className="mt-auto border-t border-[#202d52] pt-4 text-xs text-[#7f8db2]">
        <p className="flex items-center gap-2 text-[#4ade80]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" />
          SDK 已连接
        </p>
        <button className="mt-3 flex items-center gap-2 hover:text-white" onClick={onLogout}>
          <LogOut size={14} />
          退出登录
        </button>
      </div>
    </aside>
  )
}

function Topbar({
  application,
  applications,
  onApplicationChange,
  environment,
  range,
  onEnvironmentChange,
  onRangeChange,
  onRefresh,
}: {
  application: Application | null
  applications: Application[]
  onApplicationChange: (id: string) => void
  environment: string
  range: string
  onEnvironmentChange: (value: string) => void
  onRangeChange: (value: string) => void
  onRefresh: () => void
}) {
  return (
    <header className="fixed inset-x-0 top-0 z-10 flex h-16 items-center justify-end gap-3 border-b border-[#202d52] bg-[#0b1020]/95 px-4 backdrop-blur sm:px-6 lg:static lg:border-0 lg:bg-transparent lg:px-8">
      <div className="mr-auto hidden items-center gap-3 lg:flex">
        <select
          value={application?.id ?? ''}
          onChange={(event) => onApplicationChange(event.target.value)}
          className="rounded-lg border border-[#2b3a68] bg-[#17244a] px-3 py-2 text-sm text-white outline-none"
        >
          {applications.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <select
          value={environment}
          onChange={(event) => onEnvironmentChange(event.target.value)}
          className="rounded-lg border border-[#2b3a68] bg-[#17244a] px-3 py-2 font-mono text-[11px] text-[#75e3f5] outline-none"
        >
          <option>development</option>
          <option>staging</option>
          <option>production</option>
        </select>
        <span className="font-mono text-[10px] text-[#4ade80]">DSN Active</span>
      </div>
      <select
        value={range}
        onChange={(event) => onRangeChange(event.target.value)}
        className="rounded-lg border border-[#2b3a68] bg-[#151e38] px-3 py-2 text-xs text-[#b8c3ea] outline-none"
      >
        <option>最近 24 小时</option>
        <option>最近 7 天</option>
        <option>最近 30 天</option>
      </select>
      <Button variant="ghost" className="h-9 w-9 p-0" onClick={onRefresh} aria-label="刷新监控数据">
        <RefreshCw size={16} />
      </Button>
      <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 text-xs font-semibold">
        W
      </div>
    </header>
  )
}

function Metrics({ overview }: { overview: ApplicationOverview | null }) {
  const metrics = [
    ['错误事件', overview ? String(overview.errors) : '—', '实时', 'text-[#ff7a85]'],
    ['性能异常', overview ? String(overview.performance) : '—', '实时', 'text-[#ffb454]'],
    ['自定义埋点', overview ? String(overview.customEvents) : '—', '实时', 'text-[#75e3f5]'],
    ['应用可用率', '99.98%', '稳定', 'text-[#4ade80]'],
  ]
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map(([label, value, trend, trendColor]) => (
        <div key={label} className="rounded-xl border border-[#2b3a68] bg-[#151e38] p-4">
          <p className="text-xs text-[#92a0c3]">{label}</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-white">{value}</p>
          <p className={cn('mt-2 font-mono text-[11px]', trendColor)}>{trend}</p>
        </div>
      ))}
    </div>
  )
}

function ChartSection({
  overview,
  trends,
}: {
  overview: ApplicationOverview | null
  trends: Array<{ bucket: string; eventType: string; count: string }>
}) {
  const chartBars = trends.slice(-12).map((item) => ({
    height: Math.max(8, Math.min(100, Number(item.count) * 18)),
    label: new Date(item.bucket).getHours().toString().padStart(2, '0'),
    type: item.eventType,
  }))
  const displayBars = chartBars.length ? chartBars : [{ height: 8, label: '--', type: 'empty' }]
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
      <section className="rounded-xl border border-[#2b3a68] bg-[#151e38] p-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-medium text-white">事件趋势</h2>
            <p className="mt-1 font-mono text-[10px] text-[#8ea1c7]">Errors · Performance · Custom Events</p>
          </div>
        </div>
        <div className="mt-5 flex h-52 items-end gap-2 rounded-lg bg-[#10182f] px-4 pb-4 pt-6">
          {displayBars.map((bar, index) => (
            <div key={index} className="group flex h-full flex-1 items-end">
              <div
                className={cn(
                  'w-full rounded-t-md transition-all group-hover:brightness-125',
                  index % 4 === 0 ? 'bg-[#22d3ee]' : index % 3 === 0 ? 'bg-[#a855f7]' : 'bg-[#5368f2]'
                )}
                style={{ height: `${bar.height}%` }}
              />
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-between font-mono text-[10px] text-[#7c8bff]">
          {displayBars.map((bar, index) => (
            <span key={`${bar.label}-${index}`}>{bar.label}</span>
          ))}
        </div>
        <p className="mt-4 text-[10px] text-[#6f7da1]">事件按照 eventType 和 timestamp 聚合 · tooltip</p>
      </section>
      <section className="rounded-xl border border-[#2b3a68] bg-[#151e38] p-5">
        <h2 className="font-medium text-white">事件类型分布</h2>
        <div className="mt-7 grid place-items-center">
          <div
            className="grid h-36 w-36 place-items-center rounded-full"
            style={{
              background: 'conic-gradient(#a855f7 0 42%, #5368f2 42% 70%, #22d3ee 70% 88%, #334477 88% 100%)',
            }}
          >
            <div className="grid h-24 w-24 place-items-center rounded-full bg-[#151e38] font-mono text-xl text-[#a855f7]">
              {overview?.total
                ? `${Math.round(((overview.errors + overview.performance) / overview.total) * 100)}%`
                : '—'}
            </div>
          </div>
        </div>
        <div className="mt-6 space-y-2 font-mono text-[10px] text-[#aab6d8]">
          <p>
            ● error <span className="float-right">{overview?.eventTypes.error ?? 0}</span>
          </p>
          <p className="text-[#75e3f5]">
            ● performance <span className="float-right">{overview?.eventTypes.performance ?? 0}</span>
          </p>
          <p className="text-[#a855f7]">
            ● custom <span className="float-right">{overview?.eventTypes.custom ?? 0}</span>
          </p>
          <p className="text-[#7c8bff]">
            ● navigation <span className="float-right">12%</span>
          </p>
        </div>
      </section>
    </div>
  )
}

function ErrorSummary({
  overview,
  onSelect,
}: {
  overview: ApplicationOverview | null
  onSelect: (error: string) => void
}) {
  const errors = (overview?.recentEvents ?? []).filter((event) => event.eventType === 'error').slice(0, 5)
  return (
    <section className="rounded-xl border border-[#2b3a68] bg-[#151e38] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-medium text-white">错误监控</h2>
          <p className="mt-2 font-mono text-[10px] text-[#ffb0b5]">
            错误总量 {overview?.errors ?? 0} · 数据来自当前应用和环境
          </p>
        </div>
      </div>
      <div className="mt-5 divide-y divide-[#223053]">
        {errors.map((event, index) => (
          <button
            key={String(event.eventId ?? index)}
            onClick={() =>
              onSelect(String((event.payload as Record<string, unknown>)?.message ?? event.eventType))
            }
            className="flex w-full items-center gap-3 py-3 text-left transition hover:bg-white/[0.02]"
          >
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#ff7a85] shadow-[0_0_10px_#ff7a85]" />
            <span className="min-w-0 flex-1 truncate text-sm text-[#dce3ff]">
              {String((event.payload as Record<string, unknown>)?.message ?? '未命名错误')}
            </span>
            <span className="hidden w-28 text-right font-mono text-[10px] text-[#9ba8cc] sm:block">
              {String(event.timestamp ?? '')}
            </span>
            <span className="rounded-full bg-[#4a2f2d] px-2 py-1 font-mono text-[10px] text-[#ffb454]">
              未处理
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}

function ErrorDrawer({ error, onClose }: { error: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/50" onClick={onClose}>
      <aside
        className="h-full w-full max-w-[560px] overflow-y-auto border-l border-[#7c5cff] bg-[#151e38] p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xl font-medium text-white">{error}</p>
            <p className="mt-2 font-mono text-[10px] text-[#75e3f5]">
              eventId evt_01H7ABC · eventType error · timestamp 2026-10-31 14:24
            </p>
          </div>
          <button onClick={onClose} className="text-[#aab6d8] hover:text-white" aria-label="关闭错误详情">
            <X size={20} />
          </button>
        </div>
        <dl className="mt-8 space-y-3 font-mono text-xs">
          <div>
            <dt className="text-[#7f8db2]">appId / sessionId</dt>
            <dd className="mt-1 text-[#dce3ff]">checkout-web / sess_mock_01</dd>
          </div>
          <div>
            <dt className="text-[#7f8db2]">sdkVersion / environment</dt>
            <dd className="mt-1 text-[#dce3ff]">1.8.2 / production</dd>
          </div>
          <div>
            <dt className="text-[#7f8db2]">origin / pathname</dt>
            <dd className="mt-1 text-[#dce3ff]">https://app.example.local /checkout</dd>
          </div>
        </dl>
        <div className="mt-8 rounded-lg border border-[#5b3344] bg-[#2d1d31] p-4 font-mono text-xs text-[#ff9da5]">
          <p>错误堆栈</p>
          <p className="mt-3">
            TypeError at checkout.ts:184
            <br /> at submitOrder (checkout.ts:184)
            <br /> at HTMLButtonElement.onclick
          </p>
        </div>
        <div className="mt-6 space-y-3 text-xs leading-6 text-[#b8c3ea]">
          <p>
            eventId 用于保证同一个事件在重试过程中保持身份不变，服务端可以利用它进行去重、统计和问题追踪。
          </p>
          <p>sessionId 第一版只表示当前 SDK 实例生命周期，不读取 Cookie 或 localStorage。</p>
        </div>
      </aside>
    </div>
  )
}
