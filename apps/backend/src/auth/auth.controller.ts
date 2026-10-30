import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common'
import { Request } from 'express'
import { AuthService } from './auth.service'
import { LoginDto, RefreshDto, RegisterDto } from './dto/auth.dto'
import { AccessGuard } from './guards/access.guard'

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post('register') register(@Body() dto: RegisterDto) {
    return this.auth.register(dto)
  }
  @Post('login') login(@Body() dto: LoginDto) {
    return this.auth.login(dto)
  }
  @UseGuards(AccessGuard) @Get('me') me(
    @Req() req: Request & { user: { id: string; username: string; displayName: string | null } }
  ) {
    return req.user
  }
  @Post('refresh') refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto)
  }
  @Post('logout') logout(@Body() dto: RefreshDto) {
    return this.auth.logout(dto)
  }
  @UseGuards(AccessGuard) @Post('logout-all') logoutAll(@Req() req: Request & { user: { id: string } }) {
    return this.auth.logoutAll(req.user.id)
  }
}
