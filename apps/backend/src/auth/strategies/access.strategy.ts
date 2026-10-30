import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { UsersService } from '../../users/users.service'

@Injectable()
export class AccessStrategy extends PassportStrategy(Strategy, 'access') {
  constructor(
    config: ConfigService,
    private readonly users: UsersService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow('JWT_ACCESS_SECRET'),
    })
  }
  async validate(payload: { sub: string; type: string }) {
    if (payload.type !== 'access') throw new UnauthorizedException()
    const user = await this.users.findById(payload.sub)
    if (!user || user.status !== 'active') throw new UnauthorizedException()
    return user
  }
}
