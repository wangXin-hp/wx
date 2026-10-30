import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { randomBytes } from 'crypto'
import { Repository } from 'typeorm'
import { ApplicationEntity } from './application.entity'
import { CreateApplicationDto, UpdateApplicationDto } from './dto/application.dto'

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(ApplicationEntity) private readonly applications: Repository<ApplicationEntity>
  ) {}
  list(ownerId: string) {
    return this.applications.find({ where: { ownerId }, order: { createdAt: 'DESC' } })
  }
  async create(ownerId: string, dto: CreateApplicationDto) {
    const entity = this.applications.create({ ...dto, ownerId, publicKey: this.key() })
    return this.output(await this.applications.save(entity))
  }
  async find(ownerId: string, id: string) {
    const entity = await this.applications.findOne({ where: { id, ownerId } })
    if (!entity) throw new NotFoundException('Application not found')
    return this.output(entity)
  }
  async update(ownerId: string, id: string, dto: UpdateApplicationDto) {
    const entity = await this.applications.findOne({ where: { id, ownerId } })
    if (!entity) throw new NotFoundException('Application not found')
    Object.assign(entity, dto)
    return this.output(await this.applications.save(entity))
  }
  async rotate(ownerId: string, id: string) {
    const entity = await this.applications.findOne({ where: { id, ownerId } })
    if (!entity) throw new NotFoundException('Application not found')
    entity.publicKey = this.key()
    return this.output(await this.applications.save(entity))
  }
  async remove(ownerId: string, id: string) {
    const entity = await this.applications.findOne({ where: { id, ownerId } })
    if (!entity) throw new NotFoundException('Application not found')
    await this.applications.remove(entity)
    return { deleted: true }
  }
  private key() {
    return randomBytes(24).toString('base64url')
  }
  private output(entity: ApplicationEntity) {
    return {
      ...entity,
      dsn: `${process.env.TRACEKIT_COLLECTOR_BASE_URL ?? 'http://localhost:3000'}/collect/${entity.publicKey}/${entity.id}`,
    }
  }
}
