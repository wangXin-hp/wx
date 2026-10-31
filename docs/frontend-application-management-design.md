# TraceKit 前端应用管理与监控页面开发设计

## 1. 文档目的

本文档用于约束登录后的控制台开发，目标是让应用管理、应用切换、DSN 管理和监控页面保持统一的 UI 风格，并与当前后端接口及 SDK 事件协议保持一致。

当前前端技术栈：

- React 18.3.1
- Vite 6
- TypeScript
- Tailwind CSS 4
- shadcn/ui 风格的本地 UI 组件
- Lucide Icons

当前视觉基线来自 `apps/frontend/docs/untitled_1.pen`：

- 页面背景：`#0B1020`
- 侧边栏：`#10182F`
- 卡片：`#151E38`
- 输入框：`#10182F`
- 边框：`#2B3A68`
- 主色：紫色、蓝色、青色
- 成功：绿色
- 警告：橙色
- 错误：红色
- 主要圆角：8px、12px
- 代码和协议字段使用等宽字体

## 2. 当前后端能力

当前已经存在并可直接接入的接口：

```text
POST   /auth/register
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
POST   /auth/logout-all
GET    /auth/me

GET    /applications
POST   /applications
GET    /applications/:id
PATCH  /applications/:id
DELETE /applications/:id
POST   /applications/:id/rotate-dsn
```

所有应用接口都要求 Access Token。后端通过 `ownerId` 限制用户只能访问自己的应用。

当前还没有事件接收和统计查询接口，因此错误、性能和埋点图表暂时不能接入真实数据。需要后续增加：

```text
POST /collect
GET  /applications/:id/overview
GET  /applications/:id/errors
GET  /applications/:id/performance
GET  /applications/:id/events
```

## 3. 应用数据模型

前端统一使用以下类型：

```ts
type Environment = 'development' | 'staging' | 'production'
type ApplicationStatus = 'active' | 'disabled'

interface Application {
  id: string
  ownerId: string
  name: string
  slug: string
  environment: Environment
  publicKey: string
  status: ApplicationStatus
  description: string | null
  dsn: string
  createdAt: string
  updatedAt: string
}
```

页面中的应用身份必须始终由以下组合确定：

```text
applicationId + environment
```

不同应用或不同环境切换后，所有总览指标、错误列表、性能数据和埋点数据都必须重新请求。不能保留上一个应用的图表数据。

## 4. 页面结构

建议使用以下目录结构：

```text
apps/frontend/src/
  app/
    App.tsx
    router.tsx
  components/
    ui/
    layout/
      AppShell.tsx
      Sidebar.tsx
      Topbar.tsx
      ApplicationSelector.tsx
      EnvironmentSelector.tsx
  features/
    auth/
    applications/
      application-api.ts
      application-types.ts
      ApplicationManagementPage.tsx
      ApplicationDetailPage.tsx
      ApplicationSelectorPanel.tsx
      CreateApplicationModal.tsx
      EditApplicationModal.tsx
      DsnPanel.tsx
      DsnRotateDialog.tsx
    dashboard/
      DashboardPage.tsx
      OverviewMetrics.tsx
      EventTrendChart.tsx
      EventTypeDistribution.tsx
      ErrorSummary.tsx
    errors/
    performance/
    events/
  lib/
    api-client.ts
    auth-storage.ts
    format.ts
```

`AppShell` 负责侧边栏、顶部栏和内容区域。各业务页面只负责自己的内容，避免每个页面重复实现导航和 Token 处理。

## 5. 应用管理页

路由或页面状态：

```text
/applications
```

页面内容：

- 页面标题：应用管理
- 副标题：创建和管理你的监控应用及环境
- 创建应用按钮
- 应用表格
- 空状态
- 加载状态
- 请求错误状态

表格字段：

| 字段        | 展示方式                           |
| ----------- | ---------------------------------- |
| name        | 主标题，可点击进入详情             |
| slug        | 次级文本                           |
| environment | 彩色状态标签                       |
| description | 截断显示，空值显示 `—`             |
| status      | active 使用绿色，disabled 使用橙色 |
| publicKey   | 等宽字体                           |
| dsn         | 截断显示，支持复制                 |
| createdAt   | 格式化为本地时间                   |
| 操作        | 更多菜单                           |

操作菜单：

- 查看详情
- 复制 DSN
- 编辑应用
- 旋转 DSN
- 禁用应用
- 删除应用

## 6. 创建应用

接口：

```text
POST /applications
```

请求体：

```json
{
  "name": "Checkout Web",
  "slug": "checkout-web",
  "environment": "production",
  "description": "支付结算前端"
}
```

弹窗字段：

- 应用名称
- slug
- 应用描述
- environment 下拉选择

前端校验：

- name 必填
- slug 必须匹配 `^[a-z0-9-]+$`
- environment 必须选择
- 提交期间按钮显示“创建中…”
- 后端返回重复应用错误时保留弹窗并显示错误信息

创建成功后：

1. 关闭弹窗。
2. 将新应用插入列表顶部。
3. 自动选中新应用。
4. 显示 DSN 复制提示。
5. 用户可以进入应用详情。

## 7. 应用详情页

页面内容：

- 应用名称和状态
- slug
- applicationId
- environment
- description
- 创建时间
- 更新时间
- public key
- DSN
- SDK 初始化代码

DSN 面板：

```text
tracekit://public-key@collector.local/application-id
```

操作：

- 复制 DSN
- 旋转 DSN

SDK 示例代码：

```ts
import { initBrowserMonitoring } from '@trace-kit/browser'

initBrowserMonitoring({
  dsn: 'tracekit://public-key@collector.local/application-id',
  environment: 'production',
})
```

## 8. 编辑、禁用和删除

编辑接口：

```text
PATCH /applications/:id
```

可编辑字段：

- name
- description
- status

禁用应用前显示确认弹窗：

```text
禁用后，使用当前 DSN 的 SDK 上报应被服务端拒绝。历史数据仍然保留。
```

删除应用前显示高风险确认弹窗。确认内容需要包括应用名称和 environment，避免误删。

删除接口：

```text
DELETE /applications/:id
```

删除成功后：

- 从应用列表移除
- 如果删除的是当前应用，自动选择列表中的下一条应用
- 如果没有剩余应用，显示空状态

## 9. DSN 旋转

接口：

```text
POST /applications/:id/rotate-dsn
```

确认文案：

```text
旋转后旧 DSN 会立即失效，新的事件必须使用新 DSN。
应用内部 ID 不会改变，历史事件仍然归属于当前应用。
```

成功后：

- 更新当前应用的 publicKey 和 dsn
- 显示新 DSN
- 提供复制按钮
- 提示用户更新业务项目中的 SDK 配置

## 10. 应用选择器

应用选择器显示当前用户的应用和环境列表：

```text
Checkout Web
  development
  staging
  production

Admin Console
  staging
  production
```

每条环境记录显示：

- 应用名称
- slug
- environment
- DSN 状态
- applicationId
- 最近事件数量（接入统计接口后显示）

切换应用时：

1. 更新全局当前应用状态。
2. 更新 URL 或路由参数。
3. 清空旧页面的 loading、error 和数据状态。
4. 重新加载当前应用的统计数据。

推荐使用 URL 表达当前上下文：

```text
/applications/:applicationId/overview?environment=production
```

## 11. Token 和请求层

前端增加统一 `api-client.ts`：

- 自动读取 Access Token
- 自动添加 Authorization Header
- 统一解析后端错误
- 遇到 401 时调用 `/auth/refresh`
- Refresh Token 失效时清理本地凭证并回到登录页

不要在各个页面重复实现 Token 读取和错误解析。

## 12. 监控总览页

当前总览页的 Mock 数据需要改造成按应用读取：

```text
GET /applications/:id/overview?environment=production&range=7d
```

建议响应结构：

```json
{
  "applicationId": "application-id",
  "environment": "production",
  "range": "7d",
  "metrics": {
    "errors": 1284,
    "performance": 326,
    "customEvents": 48291,
    "availability": 99.98
  },
  "trend": [],
  "eventTypes": [],
  "recentErrors": []
}
```

在后端聚合接口完成前，页面保留 Mock 数据，但必须在页面上标记“示例数据”，避免把静态数据误认为真实监控结果。

## 13. 后续事件接口设计

SDK 上报接口：

```text
POST /collect
```

请求体：

```json
{
  "events": [
    {
      "eventId": "evt_01",
      "eventType": "error",
      "timestamp": 1760000000000,
      "appId": "application-id",
      "sessionId": "session-id",
      "sdkName": "@trace-kit/browser",
      "sdkVersion": "0.1.0",
      "environment": "production",
      "context": {},
      "payload": {}
    }
  ]
}
```

DSN 解析流程：

```text
DSN
  ↓
查找 publicKey
  ↓
确认应用存在且 status = active
  ↓
获得 applicationId 和 environment
  ↓
保存事件
```

## 14. 实施顺序

建议按以下检查点推进：

### 检查点一：应用管理真实联调

- 统一 API Client
- 应用列表
- 创建应用
- 复制 DSN
- 应用空状态和错误状态

### 检查点二：应用详情和 DSN 操作

- 应用详情
- 编辑应用
- 禁用应用
- 删除应用
- DSN 旋转
- SDK 接入代码复制

### 检查点三：应用选择器和页面上下文

- 多应用选择
- 环境选择
- 当前 applicationId 持久化
- 路由参数
- 应用切换后的数据清理和重新加载

### 检查点四：数据接收

- `/collect`
- DSN 验证
- 事件入库
- 重复 eventId 去重
- 错误响应规范

### 检查点五：统计查询和图表

- 总览聚合
- 错误列表
- Web Vitals 查询
- 自定义事件查询
- 时间范围筛选
- 前端图表替换 Mock 数据

## 15. 验收标准

- 用户只能看到自己的应用。
- 同一个用户可以创建多个应用。
- 相同 slug 在不同 environment 可以创建。
- 相同 slug 和 environment 不能重复创建。
- DSN 可以复制和旋转。
- 旋转 DSN 后应用 ID 不变。
- 应用切换后页面标题、环境、DSN 和数据上下文同步变化。
- 应用列表、弹窗、详情页使用同一套颜色、圆角、字体和状态标签。
- 加载、空数据、请求失败和禁用状态都有明确界面。
- 前端所有请求都经过统一 API Client。
- 真实数据接入前，Mock 数据明确标记为示例数据。
