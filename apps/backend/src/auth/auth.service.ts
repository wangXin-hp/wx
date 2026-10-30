import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UsersService } from '../users/users.service'
import { RefreshSessionEntity } from './refresh-session.entity'
import { LoginDto, RefreshDto, RegisterDto } from './dto/auth.dto'

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @InjectRepository(RefreshSessionEntity) private readonly sessions: Repository<RefreshSessionEntity>
  ) {}
  async register(dto: RegisterDto) {
    const user = await this.users.create(dto.username, await bcrypt.hash(dto.password, 12), dto.displayName)
    return this.issue(user)
  }
  async login(dto: LoginDto) {
    const user = await this.users.findByUsername(dto.username)
    if (!user || user.status !== 'active' || !(await bcrypt.compare(dto.password, user.passwordHash)))
      throw new UnauthorizedException('Invalid credentials')
    await this.users.touchLogin(user)
    return this.issue(user)
  }
  async refresh(dto: RefreshDto) {
    let payload: { sub: string; sessionId: string; type: string }
    try {
      payload = await this.jwt.verifyAsync(dto.refreshToken, {
        secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
      })
    } catch {
      throw new UnauthorizedException('Invalid refresh token')
    }
    if (payload.type !== 'refresh') throw new UnauthorizedException('Invalid refresh token')
    const session = await this.sessions.findOne({ where: { id: payload.sessionId, userId: payload.sub } })
    if (
      !session ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      !(await bcrypt.compare(dto.refreshToken, session.tokenHash))
    )
      throw new UnauthorizedException('Invalid refresh token')
    session.revokedAt = new Date()
    session.lastUsedAt = new Date()
    await this.sessions.save(session)
    const user = await this.users.findById(payload.sub)
    if (!user || user.status !== 'active') throw new UnauthorizedException('Invalid refresh token')
    return this.issue(user)
  }
  async logout(dto: RefreshDto) {
    try {
      const payload = await this.jwt.verifyAsync<{ sessionId: string }>(dto.refreshToken, {
        secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
      })
      await this.sessions.update({ id: payload.sessionId }, { revokedAt: new Date() })
    } catch {
      /* logout is idempotent */
    }
    return { loggedOut: true }
  }
  async logoutAll(userId: string) {
    await this.sessions.update({ userId, revokedAt: undefined }, { revokedAt: new Date() })
    return { loggedOut: true }
  }
  async issue(user: { id: string; username: string; displayName: string | null }) {
    const accessToken = await this.jwt.signAsync({ sub: user.id, type: 'access' })
    const session = this.sessions.create({
      userId: user.id,
      tokenHash: '',
      expiresAt: new Date(Date.now() + this.duration('JWT_REFRESH_EXPIRES_IN', 604800000)),
      revokedAt: null,
      userAgent: null,
      ipAddress: null,
      lastUsedAt: null,
    })
    const saved = await this.sessions.save(session)
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, sessionId: saved.id, type: 'refresh' },
      {
        secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      }
    )
    saved.tokenHash = await bcrypt.hash(refreshToken, 12)
    await this.sessions.save(saved)
    return {
      accessToken,
      refreshToken,
      user: { id: user.id, username: user.username, displayName: user.displayName },
    }
  }
  private duration(key: string, fallback: number): number {
    const value = this.config.get(key)
    if (!value) return fallback
    const match = /^([0-9]+)([smhd])$/.exec(value)
    if (!match || !match[1] || !match[2]) return fallback
    const unit = ({ s: 1000, m: 60000, h: 3600000, d: 86400000 } as Record<string, number>)[match[2]]
    return unit ? Number(match[1]) * unit : fallback
  }
}
