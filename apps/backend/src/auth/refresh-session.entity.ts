import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { UserEntity } from '../users/user.entity'

@Entity('refresh_sessions')
export class RefreshSessionEntity {
  @PrimaryGeneratedColumn('uuid') id!: string
  @Index() @Column({ name: 'user_id', type: 'uuid' }) userId!: string
  @Column({ name: 'token_hash', length: 255 }) tokenHash!: string
  @Column({ name: 'expires_at', type: 'timestamptz' }) expiresAt!: Date
  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true }) revokedAt!: Date | null
  @Column({ name: 'user_agent', type: 'varchar', length: 500, nullable: true }) userAgent!: string | null
  @Column({ name: 'ip_address', type: 'varchar', length: 64, nullable: true }) ipAddress!: string | null
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date
  @Column({ name: 'last_used_at', type: 'timestamptz', nullable: true }) lastUsedAt!: Date | null
  @ManyToOne(() => UserEntity, (user) => user.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity
}
