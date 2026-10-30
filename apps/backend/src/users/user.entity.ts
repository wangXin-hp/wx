import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { ApplicationEntity } from '../applications/application.entity'
import { RefreshSessionEntity } from '../auth/refresh-session.entity'

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid') id!: string
  @Index({ unique: true }) @Column({ length: 50 }) username!: string
  @Column({ name: 'password_hash', length: 255 }) passwordHash!: string
  @Column({ name: 'display_name', type: 'varchar', length: 80, nullable: true }) displayName!: string | null
  @Column({ length: 20, default: 'active' }) status!: 'active' | 'disabled'
  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true }) lastLoginAt!: Date | null
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date
  @OneToMany(() => ApplicationEntity, (application) => application.owner) applications!: ApplicationEntity[]
  @OneToMany(() => RefreshSessionEntity, (session) => session.user) sessions!: RefreshSessionEntity[]
}
