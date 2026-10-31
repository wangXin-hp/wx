import { Activity, ArrowUpRight, Zap } from 'lucide-react'

const bars = [34, 54, 44, 67, 58, 76, 64, 82, 70, 92, 78, 100]

export function BrandPanel() {
  return (
    <section className="relative flex min-h-[620px] flex-1 flex-col justify-between overflow-hidden border-b border-white/[0.07] px-7 py-7 sm:px-12 lg:min-h-screen lg:border-b-0 lg:border-r lg:px-[7vw] lg:py-12">
      <div className="absolute -left-28 -top-32 h-[420px] w-[420px] rounded-full bg-violet-600/10 blur-3xl" />
      <div className="absolute bottom-[-180px] right-[-100px] h-[440px] w-[440px] rounded-full bg-cyan-500/[0.07] blur-3xl" />
      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 shadow-lg shadow-violet-500/20">
            <Activity size={21} strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-[15px] font-bold tracking-[0.22em] text-white">NEXUS</div>
            <div className="text-[9px] font-semibold tracking-[0.33em] text-slate-500">OBSERVE</div>
          </div>
        </div>
        <div className="mt-20 max-w-[560px] lg:mt-[15vh]">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-3 py-1.5 text-[11px] font-medium text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_#6ee7b7]" />
            ALL SYSTEMS OPERATIONAL
          </div>
          <h1 className="max-w-[640px] text-4xl font-semibold leading-[1.1] tracking-[-0.04em] text-white sm:text-5xl xl:text-[62px]">
            看见每一个
            <br />
            <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
              关键变化
            </span>
          </h1>
          <p className="mt-6 max-w-[470px] text-[15px] leading-7 text-slate-400">
            让数据讲述正在发生的故事。实时掌握你的产品、团队与用户体验。
          </p>
        </div>
      </div>
      <TrafficOverview />
      <div className="relative z-10 mt-8 flex items-center gap-2 text-[10px] text-slate-600">
        <Zap size={12} className="text-violet-400" />
        Built for teams that move fast<span className="mx-1 text-slate-700">•</span>v2.4.1
      </div>
    </section>
  )
}

function TrafficOverview() {
  return (
    <div className="relative z-10 mt-14 max-w-[640px] lg:mt-0">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          Live traffic overview
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-emerald-300">
          <ArrowUpRight size={13} />
          18.4%
        </span>
      </div>
      <div className="rounded-2xl border border-white/[0.09] bg-white/[0.035] p-5 backdrop-blur-sm">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="text-xs text-slate-500">Requests / min</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">48,291</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Last 24 hours</p>
            <p className="mt-1 text-sm text-slate-300">Updated just now</p>
          </div>
        </div>
        <div className="flex h-28 items-end gap-1.5 sm:gap-2">
          {bars.map((height, index) => (
            <div key={index} className="group relative flex h-full flex-1 items-end">
              <div
                className="w-full rounded-t-[4px] bg-gradient-to-t from-violet-600/80 to-cyan-300/80 transition-all duration-300 group-hover:from-violet-400 group-hover:to-cyan-200"
                style={{ height: `${height}%` }}
              />
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-between text-[10px] text-slate-600">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>Now</span>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <Stat label="Active users" value="1,284" tone="cyan" />
        <Stat label="Error rate" value="0.12%" tone="violet" />
        <Stat label="Uptime" value="99.99%" tone="emerald" />
      </div>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone: 'cyan' | 'violet' | 'emerald' }) {
  const color = tone === 'cyan' ? 'text-cyan-300' : tone === 'violet' ? 'text-violet-300' : 'text-emerald-300'
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-3">
      <p className="text-[10px] text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-semibold tracking-tight ${color}`}>{value}</p>
    </div>
  )
}
