# 检查点 1：架构决策

## 1. 为什么拆成 core 与 browser

`core` 的目标是保存与运行环境无关的事件协议、客户端生命周期和 Transport 接口，因此它的 TypeScript `lib` 只有 ES2022。若在 core 中直接使用 `window`、`document` 或 `navigator`，类型检查就应该失败。

`browser` 才拥有 DOM 权限。后续错误监听、Performance API、页面上下文和 HTTP/Beacon 上报都放在这里。这个边界可以防止浏览器实现细节污染公共协议，也为未来增加 Node.js SDK 保留空间。

## 2. 为什么同时输出 ESM 和 CJS

现代前端工具主要消费 ESM，但部分 Node.js 工具和旧项目仍通过 `require()` 使用 CJS。双模块输出能制造一段真实的兼容性实践，不过代价是必须维护并验证两套入口。

本项目约定：

- `import` → `dist/index.js`
- `require` → `dist/index.cjs`
- TypeScript → `dist/types/index.d.ts`

不能只看构建命令成功；必须核对 `package.json#exports` 指向的文件真实存在。

## 3. 为什么 JavaScript 与声明文件分开构建

tsup 负责快速转译 ESM/CJS，`tsc` 使用独立配置生成声明文件。这样做把“运行时代码是否能构建”和“公共类型是否正确”拆成两个可单独调试的问题。

`tsup` 设置 `clean: false`，因为包级 `build` 已经在最开始统一清理 `dist`。如果每个子任务再次清理，后运行的任务可能删除前一个任务的产物。

## 4. 为什么 browser 不打包 core

browser 的 tsup 配置把 `@trace-kit/core` 标记为 external，生成代码保留包导入。这样消费者依赖图清晰，也避免多个上层包分别内联一份 core。

代价是 browser 必须在 `dependencies` 中声明 core，不能只依靠开发环境碰巧能访问 workspace 源码。

## 5. 为什么 typecheck 依赖上游 build

browser 和 playground 通过各包 `exports.types` 查找声明文件。全新检出时这些声明还不存在，因此 Turbo 的 `typecheck` 先构建上游包。后续如果改用 TypeScript project references，可以重新评估这项策略。

## 6. 为什么暂不安装业务依赖

当前目标只是证明工程链路可运行。React、web-vitals、NestJS、ClickHouse 等依赖在此阶段没有消费者，提前加入只会增加升级、审计和理解成本。`web-vitals` 会在真正实现性能 Integration 时安装。

## 7. 注释约定

- 公共 API 使用中文 JSDoc 解释语义和边界。
- 非直观代码说明“为什么这样做”以及违反约束的后果。
- 不给赋值、循环、条件分支等显而易见的语句逐行翻译。
- 更长的取舍进入架构文档，避免源文件变成教程文章。

## 8. Core 事件协议的职责边界

`EventEnvelope` 是跨运行时的数据契约，而不是某个浏览器 API 的镜像。它只描述后端去重、检索和协议兼容真正需要的字段：

- `eventId` 是事件身份。它在事件创建时生成，并在 Transport 重试时保持不变；服务端可以用它做幂等去重，也能把客户端日志、上报请求和后端记录串起来。
- `sessionId` 是一次 SDK 实例生命周期的关联键。第一版不读取 Cookie、localStorage 或用户身份系统，避免在没有明确授权时扩大采集范围。
- `timestamp` 是客户端发生时间。网络延迟和离线重试会让服务端接收时间不同，因此后端以后还应保存自己的 `receivedAt`。
- `sdk.name` 和 `sdk.version` 让数据服务在协议演进时识别生产者版本，避免不同版本 payload 被错误解析。

`MonitorClient` 只负责创建 envelope、执行 `beforeSend` 和调用 Transport；重试、批量、超时和 Beacon 属于后续 browser Transport 的职责。这样核心包可以在没有 DOM 的 Node 环境中测试，也不会把网络故障处理逻辑偷偷混进事件协议。

## 9. 为什么先做安全序列化

业务代码抛出的 rejection reason 不保证是 `Error`，自定义事件也可能包含 BigInt、循环引用或读取会抛异常的 getter。`safeSerialize` 将这些值变成可传输的 JSON 结构，并对循环路径、最大深度和异常 getter 给出占位值。监控 SDK 的优先级是“记录原始故障”，不能因为记录故障本身再抛出第二个故障。

## 10. Integration 生命周期

Integration 的 `setup` 可以安装监听器并返回 teardown。客户端关闭时按后进先出顺序执行清理，再关闭 Transport；重复调用 `close()` 共享同一个 Promise，保证热更新、路由卸载或应用退出时不会重复移除监听器或重复关闭网络资源。

## 11. Turbo 的 outputs 为什么有时是空数组

`outputs` 描述“任务成功后应该被 Turbo 缓存并在下次恢复的文件”。`build` 有真实产物，所以声明 `dist/**`；lint、typecheck 和 test 通常只输出终端诊断，不应缓存整个源码树或日志，因此使用 `outputs: []`。这不会阻止任务执行，也不会决定任务是否存在；真正执行哪个命令由工作区 `package.json` 的同名 script 决定。

本项目使用 `ui: stream` 而不是 `ui: tui`，因为流式输出更适合 PowerShell、日志重定向和 CI。曾经出现的 `3221225781` 对应十六进制 `C0000135`，属于 Windows 进程加载原生依赖失败，和 lint 的 outputs 配置没有直接关系。

## 12. Browser SDK 的职责边界

Browser SDK 是 Core 的运行时适配层：它知道 `window`、`document` 和 `navigator`，但不重新定义事件协议。错误监听器只负责把浏览器事件转换成 `client.captureException()` 调用，eventId、错误归一化、beforeSend 和 Transport 仍由 Core 负责。

### 为什么使用 addEventListener

业务应用可能已经设置 `window.onerror`。直接赋值会覆盖原处理器，造成业务逻辑回归；`addEventListener('error', handler)` 可以并存多个监听器。Integration 的 teardown 会移除同一个 handler，避免热更新后重复采集。

### 为什么 rejection reason 不直接断言为 Error

JavaScript 允许 `Promise.reject('failed')`、`Promise.reject({ message: 'failed' })` 甚至 rejection 一个循环对象。BrowserErrorIntegration 原样把 `event.reason` 交给 Core 的 `normalizeError`，避免浏览器层丢失原始信息或再次抛错。

### 浏览器上下文的采集边界

第一版只保存 origin、pathname、referrer、User-Agent、language 和 platform。URL 的 query/hash 可能包含 token、手机号或业务参数，因此不采集；Cookie、localStorage、输入框内容和请求头也不在默认上下文中。上下文是环境信息，不应该变成隐式用户画像。

`initBrowserMonitoring()` 默认启用错误 Integration，但允许 `defaultIntegrations: false` 并追加自定义 Integration。当前默认 Transport 是 ConsoleTransport，方便学习，不代表事件已经可靠地送达服务器。

## 13. 性能指标的职责边界

性能指标不是普通的 `performance.now()` 差值可以替代的简单数字。CLS 需要处理布局位移窗口，LCP 需要观察候选内容变化，INP 需要分析交互延迟，TTFB/FCP 也有浏览器生命周期和页面可见性边界。TraceKit 使用官方 `web-vitals` 计算这些标准指标，只负责：

- 把 Metric 的 `name/value/delta/rating/navigationType/id` 映射为自己的 payload；
- 给事件统一添加 `eventType: performance`、context 和 eventId；
- 控制 Integration 生命周期和 `reportAllChanges` 选项。

默认不启用 `reportAllChanges`。这样一次页面生命周期通常只上报每个指标的最终值，避免同一指标的中间变化过度占用队列和存储。需要实时观察时可以显式创建 `new WebVitalsIntegration({ reportAllChanges: true })`，但服务端必须使用 `metricId` 和 `delta` 做去重或累计。

### LOAD 为什么自行计算

`web-vitals` 的核心指标集合不包含业务定义的页面 LOAD 事件，因此 TraceKit 从 Navigation Timing 的 navigation entry 读取 `loadEventEnd`。如果 load 回调刚触发时 `loadEventEnd` 仍为 0，则依次回退到 `domComplete` 和 `performance.now()`，并把 `source: navigation-timing` 写入 payload。这个回退是为了不丢失事件，不代表三个时间点语义完全相同。

### 页面隐藏和 BFCache

CLS 等指标可能在页面进入 hidden 时才得到最终值；浏览器从 back-forward cache（BFCache）恢复页面后，也可能产生新的指标实例。TraceKit 不在客户端擅自合并这些值，而是保留 `navigationType` 和 `metricId`，把去重、分组和最终统计交给数据服务。Integration close 后通过 active 标记忽略晚到回调，避免页面卸载期间继续创建事件。

## 14. DSN 是多项目隔离的第一层边界

TraceKit 不是只服务 playground 的单应用脚本，而是供多个业务项目接入的监控依赖。每个业务项目从 TraceKit 服务端申请一个 DSN，并在初始化浏览器 SDK 时传入：

```ts
initBrowserMonitoring({
  appId: 'checkout-web',
  dsn: 'tracekit://public-key@collector.example.com/project-checkout',
})
```

DSN 在当前阶段被当作公开的项目路由标识：

1. `MonitorClient` 在创建每个事件信封时写入 DSN。
2. `beforeSend` 可以脱敏 payload，但不能把事件改投到另一个 DSN。
3. Transport 重试时复用同一份 envelope，因此 DSN、eventId 和 sessionId 都保持稳定。
4. 后续 FetchTransport 会从 DSN 解析采集地址或项目键；数据服务收到事件后先校验 DSN，再写入项目维度的 PostgreSQL 元数据和 ClickHouse 事件表。

`appId` 仍然保留，它描述“哪个业务应用在发送”；DSN 描述“数据属于 TraceKit 的哪个项目”。两者不能互相替代：同一个项目可以接入多个应用，而一个应用在不同环境也可以使用不同 DSN。当前这一步只完成 SDK 协议和身份传播，尚未实现 DSN 管理后台、服务端鉴权、数据库分区或 dashboard 查询。
