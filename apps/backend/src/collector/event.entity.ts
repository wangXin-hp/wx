import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

/** 事件原始数据：租户字段单独建列，扩展字段保留在 jsonb。 */
@Entity('events')
@Index(['applicationId', 'environment', 'timestamp'])
@Index(['applicationId', 'eventType'])
export class EventEntity {
  @PrimaryGeneratedColumn('uuid') id!: string
  /** 重试期间保持不变，唯一约束用于幂等去重。 */
  @Index({ unique: true }) @Column({ name: 'event_id', length: 120 }) eventId!: string
  @Index() @Column({ name: 'application_id', type: 'uuid' }) applicationId!: string
  @Column({ length: 30 }) environment!: string
  @Index() @Column({ name: 'event_type', length: 50 }) eventType!: string
  @Column({ type: 'timestamptz' }) timestamp!: Date
  @CreateDateColumn({ name: 'received_at', type: 'timestamptz' }) receivedAt!: Date
  @Column({ name: 'session_id', type: 'varchar', length: 120, nullable: true }) sessionId!: string | null
  @Column({ name: 'sdk_name', type: 'varchar', length: 80, nullable: true }) sdkName!: string | null
  @Column({ name: 'sdk_version', type: 'varchar', length: 40, nullable: true }) sdkVersion!: string | null
  @Column({ type: 'varchar', length: 120, nullable: true }) release!: string | null
  @Column({ type: 'jsonb', default: {} }) context!: Record<string, unknown>
  @Column({ type: 'jsonb', default: {} }) payload!: Record<string, unknown>
}
