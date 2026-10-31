import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ApplicationEntity } from '../applications/application.entity'
import { EventEntity } from './event.entity'

type RawEvent = Record<string, unknown>

@Injectable()
export class CollectorService {
  constructor(
    @InjectRepository(EventEntity) private readonly events: Repository<EventEntity>,
    @InjectRepository(ApplicationEntity) private readonly applications: Repository<ApplicationEntity>
  ) {}

  /** DSN 是公开入口的身份凭证，不能只相信请求体里的 appId。 */
  async collect(rawEvents: RawEvent[]): Promise<number> {
    let accepted = 0
    for (const raw of rawEvents) {
      const event = await this.validateEvent(raw)
      if (await this.events.findOne({ where: { eventId: event.eventId } })) continue
      await this.events.save(event)
      accepted += 1
    }
    return accepted
  }

  async overview(ownerId: string, appId: string, environment?: string) {
    const application = await this.applications.findOne({ where: { id: appId, ownerId } })
    if (!application) throw new NotFoundException('应用不存在或无权访问')
    const where = { applicationId: appId, ...(environment ? { environment } : {}) }
    const items = await this.events.find({ where, order: { timestamp: 'DESC' }, take: 20 })
    const total = await this.events.count({ where })
    const [errors, performance, customEvents] = await Promise.all([
      this.events.count({ where: { ...where, eventType: 'error' } }),
      this.events.count({ where: { ...where, eventType: 'performance' } }),
      this.events.count({ where: { ...where, eventType: 'custom' } }),
    ])
    const eventTypes = await this.events
      .createQueryBuilder('event')
      .select('event.eventType', 'eventType')
      .addSelect('COUNT(*)', 'count')
      .where('event.applicationId = :appId', { appId })
      .andWhere(environment ? 'event.environment = :environment' : '1=1', { environment })
      .groupBy('event.eventType')
      .getRawMany<{ eventType: string; count: string }>()
    return {
      total,
      errors,
      performance,
      customEvents,
      eventTypes: Object.fromEntries(eventTypes.map((item) => [item.eventType, Number(item.count)])),
      recentEvents: items,
    }
  }

  async list(ownerId: string, appId: string, environment?: string, eventType?: string) {
    const application = await this.applications.findOne({ where: { id: appId, ownerId } })
    if (!application) throw new NotFoundException('应用不存在或无权访问')
    return this.events.find({
      where: {
        applicationId: appId,
        ...(environment ? { environment } : {}),
        ...(eventType ? { eventType } : {}),
      },
      order: { timestamp: 'DESC' },
      take: 100,
    })
  }

  async trend(ownerId: string, appId: string, environment?: string) {
    const application = await this.applications.findOne({ where: { id: appId, ownerId } })
    if (!application) throw new NotFoundException('应用不存在或无权访问')
    return this.events
      .createQueryBuilder('event')
      .select("date_trunc('hour', event.timestamp)", 'bucket')
      .addSelect('event.eventType', 'eventType')
      .addSelect('COUNT(*)', 'count')
      .where('event.applicationId = :appId', { appId })
      .andWhere(environment ? 'event.environment = :environment' : '1=1', { environment })
      .andWhere("event.timestamp >= now() - interval '7 days'")
      .groupBy("date_trunc('hour', event.timestamp)")
      .addGroupBy('event.eventType')
      .orderBy('bucket', 'ASC')
      .getRawMany()
  }

  private async validateEvent(raw: RawEvent): Promise<EventEntity> {
    const { publicKey, applicationId } = this.parseDsn(typeof raw.dsn === 'string' ? raw.dsn : '')
    const application = await this.applications.findOne({ where: { id: applicationId, publicKey } })
    if (!application || application.status !== 'active') throw new BadRequestException('无效或已停用的 DSN')
    if (raw.appId !== undefined && raw.appId !== application.id)
      throw new BadRequestException('事件 appId 与 DSN 不一致')
    if (raw.environment !== undefined && raw.environment !== application.environment)
      throw new BadRequestException('事件 environment 与 DSN 不一致')
    const eventId = typeof raw.eventId === 'string' ? raw.eventId : ''
    const eventType = typeof raw.eventType === 'string' ? raw.eventType : ''
    const timestamp = new Date(String(raw.timestamp ?? ''))
    if (!eventId || !eventType || Number.isNaN(timestamp.getTime()))
      throw new BadRequestException('事件缺少有效的 eventId、eventType 或 timestamp')
    return this.events.create({
      eventId,
      applicationId: application.id,
      environment: application.environment,
      eventType,
      timestamp,
      sessionId: typeof raw.sessionId === 'string' ? raw.sessionId : null,
      sdkName: typeof raw.sdkName === 'string' ? raw.sdkName : null,
      sdkVersion: typeof raw.sdkVersion === 'string' ? raw.sdkVersion : null,
      release: typeof raw.release === 'string' ? raw.release : null,
      context: isRecord(raw.context) ? raw.context : {},
      payload: isRecord(raw.payload) ? raw.payload : {},
    })
  }

  private parseDsn(dsn: string): { publicKey: string; applicationId: string } {
    try {
      const url = new URL(dsn)
      const [prefix, publicKey, applicationId] = url.pathname.split('/').filter(Boolean)
      if (!['http:', 'https:'].includes(url.protocol) || prefix !== 'collect' || !publicKey || !applicationId)
        throw new Error('invalid')
      return { publicKey, applicationId }
    } catch {
      throw new BadRequestException('DSN 格式无效')
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
