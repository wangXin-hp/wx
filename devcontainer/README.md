# TraceKit 本地部署目录

这个目录提供前端静态部署和本地基础设施配置。

## Windows 启动顺序

1. 在项目根目录启动 Nest 后端：

   ```powershell
   pnpm --filter @trace-kit/backend build
   pm2 startOrReload devcontainer/ecosystem.config.cjs --update-env
   ```

2. 构建并复制前端产物：

   ```powershell
   .\devcontainer\build-frontend.ps1
   ```

3. 启动 PostgreSQL 和 Caddy：

   ```powershell
   docker compose -f devcontainer/docker-compose.yml up -d postgres caddy
   ```

4. 打开 `http://localhost:8080`。

Caddy 容器中的 `host.docker.internal` 指向 Windows 宿主机，因此可以访问宿主机上的 PM2 Nest 服务。`Caddyfile` 中的 `try_files` 会把 React Router 的刷新路径回退到 `index.html`。

ClickHouse 使用 analytics profile 启动：

```powershell
docker compose -f devcontainer/docker-compose.yml --profile analytics up -d clickhouse
```
