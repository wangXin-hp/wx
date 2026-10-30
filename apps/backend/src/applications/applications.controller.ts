import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common'
import { Request } from 'express'
import { AccessGuard } from '../auth/guards/access.guard'
import { ApplicationsService } from './applications.service'
import { CreateApplicationDto, UpdateApplicationDto } from './dto/application.dto'

@UseGuards(AccessGuard)
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applications: ApplicationsService) {}
  @Get() list(@Req() req: Request & { user: { id: string } }) {
    return this.applications.list(req.user.id)
  }
  @Post() create(@Req() req: Request & { user: { id: string } }, @Body() dto: CreateApplicationDto) {
    return this.applications.create(req.user.id, dto)
  }
  @Get(':id') find(@Req() req: Request & { user: { id: string } }, @Param('id') id: string) {
    return this.applications.find(req.user.id, id)
  }
  @Patch(':id') update(
    @Req() req: Request & { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: UpdateApplicationDto
  ) {
    return this.applications.update(req.user.id, id, dto)
  }
  @Post(':id/rotate-dsn') rotate(@Req() req: Request & { user: { id: string } }, @Param('id') id: string) {
    return this.applications.rotate(req.user.id, id)
  }
  @Delete(':id') remove(@Req() req: Request & { user: { id: string } }, @Param('id') id: string) {
    return this.applications.remove(req.user.id, id)
  }
}
