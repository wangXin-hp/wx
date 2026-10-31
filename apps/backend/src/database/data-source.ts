import 'dotenv/config'
import { DataSource } from 'typeorm'
import { ApplicationEntity } from '../applications/application.entity'
import { RefreshSessionEntity } from '../auth/refresh-session.entity'
import { UserEntity } from '../users/user.entity'
import { EventEntity } from '../collector/event.entity'
export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: Number(process.env.DATABASE_PORT ?? 5433),
  username: process.env.DATABASE_USERNAME ?? 'postgres',
  password: process.env.DATABASE_PASSWORD ?? '',
  database: process.env.DATABASE_NAME ?? 'tracekit',
  entities: [UserEntity, ApplicationEntity, RefreshSessionEntity, EventEntity],
  // 开发时由 ts-node 加载 ts，生产迁移使用编译后的 dist/**/*.js。
  migrations: [__dirname + '/migrations/*.{js,ts}'],
})
