import { ConflictException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UserEntity } from './user.entity'

@Injectable()
export class UsersService {
  constructor(@InjectRepository(UserEntity) private readonly users: Repository<UserEntity>) {}
  findByUsername(username: string): Promise<UserEntity | null> {
    return this.users.findOne({ where: { username: username.toLowerCase() } })
  }
  findById(id: string): Promise<UserEntity | null> {
    return this.users.findOne({ where: { id } })
  }
  async create(username: string, passwordHash: string, displayName?: string): Promise<UserEntity> {
    const normalized = username.trim().toLowerCase()
    if (await this.findByUsername(normalized)) throw new ConflictException('Username already exists')
    return this.users.save(
      this.users.create({ username: normalized, passwordHash, displayName: displayName?.trim() || null })
    )
  }
  async touchLogin(user: UserEntity): Promise<void> {
    await this.users.update(user.id, { lastLoginAt: new Date() })
  }
}
