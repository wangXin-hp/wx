import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common'
import { Request } from 'express'
import { AccessGuard } from '../auth/guards/access.guard'
import { CollectorService } from './collector.service'

@Controller()
export class CollectorController {
  constructor(private readonly collector: CollectorService) {}

  @Post('collect')
  async collect(@Body() body: { events?: Array<Record<string, unknown>> }) {
    return { accepted: await this.collector.collect(body.events ?? []) }
  }

  @UseGuards(AccessGuard)
  @Get('applications/:id/overview')
  overview(
    @Req() req: Request & { user: { id: string } },
    @Param('id') id: string,
    @Query('environment') environment?: string
  ) {
    return this.collector.overview(req.user.id, id, environment)
  }

  @UseGuards(AccessGuard)
  @Get('applications/:id/events')
  events(
    @Req() req: Request & { user: { id: string } },
    @Param('id') id: string,
    @Query('environment') environment?: string,
    @Query('eventType') eventType?: string
  ) {
    return this.collector.list(req.user.id, id, environment, eventType)
  }

  @UseGuards(AccessGuard)
  @Get('applications/:id/trends')
  trends(
    @Req() req: Request & { user: { id: string } },
    @Param('id') id: string,
    @Query('environment') environment?: string
  ) {
    return this.collector.trend(req.user.id, id, environment)
  }
}
