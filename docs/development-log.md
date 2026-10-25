# TraceKit 开发与调试日志

本文件只记录亲自运行后真实发生的事情。不要为了简历提前填写不存在的问题或结果。

## 检查点 1 初始化记录（待你本地复核）

以下问题真实发生在首次工程搭建过程中。它们由协作助手先定位，不应直接当作你的个人经历；请按 README 重新运行、查看对应配置并用自己的语言补充理解。

### TypeScript 与 ESLint 工具链 peer dependency 冲突

- `pnpm` 最初解析到 TypeScript 7.0.2，但 `typescript-eslint` 声明支持范围为 `>=4.8.4 <6.1.0`。
- `pnpm peers check` 明确报告不兼容，而普通安装仍能结束，因此不能把“安装命令成功”等同于“依赖组合正确”。
- 处理方式是把 TypeScript 固定到兼容的 6.0.2，并重新执行 peer 检查，而不是忽略警告。

### pnpm 阻止 esbuild 安装脚本

- pnpm 11 默认阻止依赖执行安装脚本，Vite/tsup 使用的 esbuild 因此没有运行平台二进制安装逻辑。
- 在 `pnpm-workspace.yaml` 中仅对白名单里的 esbuild 设置 `allowBuilds: true`，没有全局放开所有依赖脚本。

### 共享配置变化没有让 Turbo 缓存失效

- 收紧根 ESLint 环境配置后，Turbo 第一次仍显示 lint `cache hit`，说明工作区任务没有把根共享配置识别为输入。
- 在 `turbo.json#globalDependencies` 声明 ESLint、Prettier 和根 TypeScript 配置后，下一次 lint 全部变为 `cache miss` 并真实重新执行。
- 这个问题说明缓存正确性的前提是输入声明完整，而不仅是开启缓存。

### 验证脚本受当前工作目录影响

- ESM/CJS 导入已经成功，但第一次产物清单检查从 `apps/playground` 使用了仓库根相对路径，导致 PowerShell 报找不到文件。
- 改用经过验证的仓库绝对根路径后，六个 SDK 产物全部找到。
- 排查时需要区分“被测功能失败”和“验证命令自身写错”。

## 记录模板

### 日期与检查点

- 日期：
- 检查点：
- 本次目标：

### 初始理解与假设

- 我认为代码会如何运行：
- 我认为最可能失败的地方：

### 实际运行

- 执行命令：
- 预期现象：
- 实际现象：
- 完整错误信息或截图位置：

### 排查过程

1. 第一个假设及验证方式：
2. 第二个假设及验证方式：
3. 最终定位证据：

### 根因与修复

- 根因：
- 修改内容：
- 为什么修改能解决问题：
- 是否存在更简单或更稳妥的方案：

### 回归验证

- 重新执行的命令：
- 新增或修改的测试：
- 最终结果：

### 我现在能独立解释什么

-

## 检查点 1 建议观察项

- 删除 `packages/core/dist` 后直接运行 browser 的类型检查，会发生什么？为什么根命令不会遇到同样问题？
- 把 browser 对 core 的依赖从 `dependencies` 删除后，开发环境和构建环境分别如何失败？
- 临时把 `exports.require` 改成不存在的文件，构建为什么仍可能成功，而消费者为什么失败？
- 将 core 的 `lib` 加入 DOM 后，哪些错误会被掩盖？
- 观察第二次运行 `pnpm build` 时 Turbo 的缓存命中情况。

这些练习应在理解后恢复配置，不要把故障状态提交到主分支。

## 检查点 2 Core SDK 记录（协作过程中的真实验证）

本节记录的是本次协作执行时实际发生的构建问题，不等于用户已经亲自完成的调试经历。你本地复现后，应把命令、观察和理解改写成自己的记录。

### 构建成功但 workspace 消费者无法加载

- 初始假设：Core 的 `tsup` 构建和类型检查通过，就可以被 browser/playground 正常消费。
- 实际现象：Core 自己的 typecheck、test、build 均通过，但全仓库 test 在 Vite 解析 `packages/core/dist/index.js` 时失败，错误指出 `./client` 不存在。
- 排查证据：产物入口保留了 `import ... from "./client"` 等无扩展名内部导入；Node/tsup 自己没有走到 Vite 的 package consumer 解析路径。
- 根因：Core 使用 `bundle: false`，多个源文件被拆成只适合特定模块解析器的产物，而包只发布 `dist/index.js`、`dist/index.cjs`。
- 修复：Core 的内部模块改为 `bundle: true`；声明文件仍由 `tsc` 单独生成。这样发布入口成为自包含 JavaScript，browser 仍通过 package exports 外部依赖 Core。
- 回归：`pnpm check` 通过；Core 17 项测试、browser 1 项测试、playground 1 项测试全部通过。

### 本检查点建议命令

```powershell
pnpm --filter @trace-kit/core test
pnpm --filter @trace-kit/core build
pnpm check
```

### 建议故障练习

1. 临时把 `packages/core/tsup.config.ts` 的 `bundle` 改回 `false`，只运行 `pnpm --filter @trace-kit/core build`，观察它为什么仍然成功。
2. 接着运行 `pnpm --filter @trace-kit/browser test`，把报错与 `dist/index.js` 的相对导入对照起来。
3. 恢复 `bundle: true` 后重跑 `pnpm check`，确认问题出在消费者解析而不是 TypeScript 类型系统。
4. 在 `beforeSend` 中返回 `null`，观察 Transport 是否收到事件；再返回一个带循环引用的 payload，观察 `safeSerialize` 的结果。

建议提交信息：`feat(core): add event protocol and lifecycle client`

## PowerShell 中的 Turbo 退出码排查

- 初始现象：执行 `pnpm check` 在 `turbo run lint` 刚开始时退出，PowerShell 显示 `3221225781`。
- 转换退出码：十六进制为 `C0000135`，属于 Windows 的 DLL/原生组件加载失败类退出码，不是 ESLint 规则报告。
- 对照验证：单独重跑 `pnpm lint` 有时可以通过，说明 lint 任务本身和 `outputs: []` 均有效；`outputs` 只控制缓存文件，不控制任务是否执行。
- 修复：将 `turbo.json` 的 `ui` 从 `tui` 改为 `stream`，避免部分 PowerShell 终端下交互式 TUI 的原生加载问题。
- 回归：`pnpm check` 的 lint、typecheck、test、build、format:check 全部通过。
