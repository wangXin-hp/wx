# TraceKit

TraceKit 是一个以学习和验证为目标的浏览器可观测性 SDK 项目。项目从空仓库逐步构建，每个阶段都保留架构决策、运行证据和真实调试记录。

当前进度：**检查点 2——Core SDK 与事件协议**。现在已经具备平台无关的事件模型、客户端生命周期、错误归一化和内存/控制台 Transport；浏览器监听、性能指标和网络批量上报仍在后续检查点。

## 为什么使用 monorepo

SDK 的平台无关能力与浏览器能力有不同的运行环境和依赖边界：

- `@trace-kit/core` 不允许依赖 DOM，未来可以被浏览器、Node.js 或其他运行时复用。
- `@trace-kit/browser` 可以使用 DOM，并通过 workspace 依赖消费 core。
- `@trace-kit/playground` 是实际消费者，用来证明 SDK 不是只能在自己的源码目录里运行。

Turborepo 在这里不是为了“工具更多”，而是为了按依赖顺序构建：core 先于 browser，browser 先于 playground。

## 项目结构

```text
apps/playground/     Vanilla TypeScript 调试应用
packages/core/       平台无关 SDK 基础包
packages/browser/    浏览器 SDK 包
docs/                架构和开发记录
```

Core SDK 的逐步阅读指南见 [docs/core-sdk-guide.md](docs/core-sdk-guide.md)，它解释事件从 `capture` 到 Transport 的完整链路，以及 eventId、sessionId、beforeSend 和安全序列化的职责。

如果 Windows PowerShell 中看到 `3221225781`，先将它转换为十六进制：`C0000135` 表示进程依赖的 DLL/原生组件没有正确加载。本项目的 Turbo 使用 `ui: stream`，避免交互式 TUI 在部分终端环境中触发这个退出问题。`turbo.json` 中 lint、typecheck、test 的 `outputs: []` 是有意的：它们只产生诊断或测试结果，不应把源码目录、日志或临时文件当作缓存产物。

## 本地运行

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

`pnpm dev` 启动前会先构建 playground 的上游依赖。浏览器打开终端给出的地址后，应看到 browser 与 core 两个包名。

## Core SDK 快速体验

```ts
import { MemoryTransport, MonitorClient } from '@trace-kit/core'

const transport = new MemoryTransport()
const client = new MonitorClient({
  appId: 'my-learning-app',
  transport,
  beforeSend(event) {
    // 脱敏和丢弃策略放在进入 Transport 前，避免敏感数据进入队列。
    return { ...event, context: { ...event.context, source: 'demo' } }
  },
})

await client.captureException(new Error('demo failure'))
await client.captureMessage('checkout started')
await client.captureEvent('button_clicked', { button: 'pay' })
```

每个事件都包含稳定的 `eventId` 和当前 SDK 实例的 `sessionId`。`eventId` 在 Transport 重试时不能重新生成；`sessionId` 第一版不读取浏览器存储，只覆盖一次客户端实例生命周期。

## 常用命令

| 命令                | 作用                            |
| ------------------- | ------------------------------- |
| `pnpm dev`          | 构建 SDK 后启动 playground      |
| `pnpm build`        | 按依赖拓扑构建全部 workspace    |
| `pnpm typecheck`    | 执行严格 TypeScript 检查        |
| `pnpm lint`         | 执行 ESLint，不修改文件         |
| `pnpm format:check` | 检查格式但不修改文件            |
| `pnpm test`         | 运行全部单元测试                |
| `pnpm check`        | 顺序执行完整本地质量门禁        |
| `pnpm clean`        | 清理工作区构建产物和 Turbo 缓存 |
| `pnpm commit`       | 使用 cz-git 生成规范提交信息    |

## 提交规范

推荐使用 `pnpm commit`，由 cz-git 引导选择 type、scope 并填写 subject。当前允许的 scope 与项目边界一致：`repo`、`core`、`browser`、`playground`、`docs`、`deps`、`release`。

cz-git 只负责降低手写提交信息的出错概率，真正的约束来自两层门禁：

1. `.husky/pre-commit` 在提交前运行 lint-staged，检查并格式化暂存文件。
2. `.husky/commit-msg` 调用 Commitlint；即使绕过 `pnpm commit` 手写信息，也必须符合 Conventional Commits、scope 列表和 100 字符标题限制。

示例：

```text
chore(repo): bootstrap tracekit workspace
feat(core): define event envelope
fix(browser): normalize rejection reason
docs(docs): record transport debugging notes
```

## 学习顺序

1. 阅读根 `package.json` 和 `pnpm-workspace.yaml`，理解 workspace 范围。
2. 阅读 `turbo.json`，画出 core → browser → playground 的构建顺序。
3. 对比两个 SDK 包的 TypeScript 配置，确认只有 browser 包包含 DOM 类型。
4. 阅读 `packages/core/src/types.ts`，解释 eventId、sessionId、sdk.version 和 timestamp 的不同职责。
5. 阅读 `packages/core/src/client.ts`，跟踪一次 `captureMessage` 从建 envelope 到 beforeSend 再到 Transport 的顺序。
6. 对照 `tsup.config.ts` 与包清单的 `exports`，确认每个路径都能在 `dist` 找到。
7. 运行 `pnpm dev`，在浏览器开发者工具中确认没有模块解析错误。
8. 把真实问题记录到 `docs/development-log.md`，不要事后虚构调试经历。

## 当前明确不包含

React、后端服务、数据库、Kafka、Docker、CI/CD、浏览器事件监听、Web Vitals 和网络批量上报都不属于当前检查点。它们会在对应需求出现时再引入，避免安装没有消费者的依赖。
