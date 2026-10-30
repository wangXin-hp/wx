import { Module } from '@nestjs/common'
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
    JwtModule.register({}),
    TypeOrmModule.forFeature([RefreshSessionEntity]),
  ],
  controllers: [AuthController],
  providers: [AuthService, AccessStrategy],
  exports: [AuthService],
})
export class AuthModule {}
