import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { UserEntity } from '../users/user.entity'

@Entity('applications')
@Index(['ownerId', 'slug', 'environment'], { unique: true })
export class ApplicationEntity {
  @PrimaryGeneratedColumn('uuid') id!: string
  @Index() @Column({ name: 'owner_id', type: 'uuid' }) ownerId!: string
  @Column({ length: 100 }) name!: string
  @Column({ length: 80 }) slug!: string
  @Column({ length: 30 }) environment!: 'development' | 'staging' | 'production'
  @Index({ unique: true }) @Column({ name: 'public_key', length: 64 }) publicKey!: string
  @Column({ length: 20, default: 'active' }) status!: 'active' | 'disabled'
  // 联合类型 string | null 会被 reflect-metadata 记录为 Object，必须显式声明数据库类型。
  @Column({ type: 'varchar', length: 500, nullable: true }) description!: string | null
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date
  @ManyToOne(() => UserEntity, (user) => user.applications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner!: UserEntity
}
