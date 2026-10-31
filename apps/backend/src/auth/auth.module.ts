import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UsersModule } from '../users/users.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { RefreshSessionEntity } from './refresh-session.entity'
import { AccessStrategy } from './strategies/access.strategy'

@Module({
  imports: [
    UsersModule,
    PassportModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        // Access Token 使用 JwtService 的默认密钥；Refresh Token 在 AuthService 中使用独立密钥签发。
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: config.get('JWT_ACCESS_EXPIRES_IN', '15m'),
        },
      }),
    }),
    TypeOrmModule.forFeature([RefreshSessionEntity]),
  ],
  controllers: [AuthController],
  providers: [AuthService, AccessStrategy],
  exports: [AuthService],
})
export class AuthModule {}
