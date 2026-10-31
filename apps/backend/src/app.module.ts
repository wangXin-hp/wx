import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from './auth/auth.module'
import { ApplicationEntity } from './applications/application.entity'
import { ApplicationsModule } from './applications/applications.module'
import { RefreshSessionEntity } from './auth/refresh-session.entity'
import { UserEntity } from './users/user.entity'
import { CollectorModule } from './collector/collector.module'
import { EventEntity } from './collector/event.entity'

@Module({
  imports: [
    // pnpm --filter 在 apps/backend 目录执行脚本；显式指定 monorepo 根目录的 .env，
    // 避免启动目录变化导致 JWT 密钥和数据库配置加载不到。
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../../.env', '.env'] }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DATABASE_HOST', 'localhost'),
        port: Number(config.get('DATABASE_PORT', 5433)),
        username: config.get('DATABASE_USERNAME', 'postgres'),
        password: config.get('DATABASE_PASSWORD', ''),
        database: config.get('DATABASE_NAME', 'tracekit'),
        entities: [UserEntity, ApplicationEntity, RefreshSessionEntity, EventEntity],
        synchronize: false,
      }),
    }),
    AuthModule,
    ApplicationsModule,
    CollectorModule,
  ],
})
export class AppModule {}
