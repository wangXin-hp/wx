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
