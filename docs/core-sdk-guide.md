# Core SDK 学习指南

这份文档解释检查点 2 的核心代码应该如何阅读。它只覆盖“事件怎样从业务代码变成一个可交给 Transport 的协议对象”，不涉及浏览器监听和 HTTP 上报。

## 1. 先记住一条调用链

```text
业务代码
  ↓ captureException / captureMessage / captureEvent
MonitorClient.capture
  ↓ 生成 eventId、timestamp、sessionId 和 EventEnvelope
safeSerialize + normalizeError
  ↓ 把不可靠的 JavaScript 值变成 JSON 安全结构
beforeSend
  ↓ 脱敏、采样、修改或返回 null 丢弃
Transport.send
  ↓ 未来可以是 Fetch、Beacon、内存或控制台
服务端 / 调试面板
```

`MonitorClient` 不负责所有事情。它负责协议和生命周期；Transport 负责事件怎么发出去。这个拆分是后面实现批量、超时和重试的前提。

## 2. 为什么需要 EventEnvelope

如果每个采集入口直接发送不同形状的数据，后端就必须为每个入口写一套解析逻辑，也无法统一去重。`EventEnvelope` 是所有事件的外壳，payload 才是事件类型对应的内容。

一次消息事件大致长这样：

```ts
{
  eventId: 'event-123',
  eventType: 'message',
  timestamp: '2026-10-25T08:00:00.000Z',
  appId: 'checkout-web',
  sessionId: 'session-abc',
  sdk: { name: '@trace-kit/core', version: '0.0.0' },
  context: { route: '/checkout' },
  payload: { message: 'checkout started', level: 'info' }
}
```

### eventId 和 sessionId 的区别

- `eventId` 标识“一条事件”。同一条事件失败后重试，ID 必须不变，服务端才能幂等去重。
- `sessionId` 标识“当前 SDK 实例产生的一组事件”。第一版每次 `new MonitorClient()` 生成一个，不读取 Cookie 或 localStorage。

所以同一个客户端的两条事件会有不同的 eventId，但共享 sessionId。

### timestamp 为什么使用客户端时间

错误发生的时刻和服务器收到请求的时刻可能相差几秒、几分钟，甚至跨离线重试。客户端 `timestamp` 保留事件发生时间；未来服务端还应补充 `receivedAt`，两者一起用于分析延迟。

### sdk.version 为什么不是 release

- `sdk.version`：采集 SDK 的代码/协议版本，决定服务端如何解析 payload。
- `release`：业务应用的发布版本，用来定位哪个前端构建引入问题。

## 3. capture 的实际过程

以 `captureMessage('checkout started')` 为例：

1. `MonitorClient` 检查自己没有关闭。
2. 使用 `idFactory()` 生成新的 eventId；sessionId 不重新生成。
3. 使用 `clock()` 生成客户端 timestamp。
4. 合并客户端公共 context 和本次调用 context。
5. 把 payload、context 转成 JSON 安全结构。
6. 调用 `beforeSend`。
7. 如果返回 `null`，事件被丢弃，Transport 不会收到它。
8. 否则调用 `transport.send(event)`。
9. 返回最终事件的 eventId，方便业务日志关联。

## 4. 为什么 beforeSend 放在 Transport 前

脱敏应该发生在事件进入队列或网络层之前。例如：

```ts
beforeSend(event) {
  const payload = event.payload as { message?: string }
  return {
    ...event,
    payload: { ...payload, message: payload.message?.replace(/token=\\w+/g, 'token=[redacted]') }
  }
}
```

它还可以用于采样：某些低价值事件返回 `null`，减少网络和存储成本。它不是错误恢复机制；如果 `beforeSend` 自己抛错，当前 `capture` 会拒绝，调用方可以决定是否记录这个 SDK 错误。

## 5. 为什么要 safeSerialize

JavaScript 的可抛出值和普通对象远比 JSON 宽松：

```ts
throw 'network failed'
throw { message: 'bad input', extra: BigInt(1) }
const value = {}
value.self = value
```

如果直接 `JSON.stringify`，BigInt 和循环引用会让监控代码再次抛错。`safeSerialize` 使用以下规则：

- `undefined` → `[undefined]`
- `NaN` / `Infinity` → 字符串
- `BigInt` → 带 `n` 后缀的字符串
- 循环路径 → `[Circular]`
- 抛错的 getter → `[Thrown while reading property: ...]`
- 过深对象 → `[MaxDepth]`

这不是为了“完美还原任意 JavaScript 对象”，而是为了优先保证监控事件能够离开当前进程。

## 6. Integration 和 close

Integration 用来把浏览器监听、性能指标等能力接入 Core：

```ts
const integration = {
  name: 'example',
  setup(client) {
    const handler = () => void client.captureMessage('something happened')
    window.addEventListener('something', handler)
    return () => window.removeEventListener('something', handler)
  },
}
```

`setup` 返回的函数就是 teardown。`close()` 会倒序执行 teardown，再关闭 Transport。倒序释放可以让后安装的资源先释放；共享 close Promise 则避免热更新触发两次监听器清理。

## 7. 当前没有做什么

当前 Core 还没有：

- `window.onerror` 或 `unhandledrejection` 监听；
- Fetch、Beacon、批量队列、超时和重试；
- Web Vitals 算法；
- Cookie、localStorage、输入框和请求头采集。

这些都属于 browser 包或具体 Transport 的职责，后续检查点会在当前协议之上增量实现。
