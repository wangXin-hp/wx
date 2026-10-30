import { MigrationInterface, QueryRunner } from 'typeorm'
export class Initial1710000000000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`)
    await q.query(
      `CREATE TABLE users (id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), username varchar(50) NOT NULL UNIQUE, password_hash varchar(255) NOT NULL, display_name varchar(80), status varchar(20) NOT NULL DEFAULT 'active', last_login_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now())`
    )
    await q.query(
      `CREATE TABLE applications (id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, name varchar(100) NOT NULL, slug varchar(80) NOT NULL, environment varchar(30) NOT NULL, public_key varchar(64) NOT NULL UNIQUE, status varchar(20) NOT NULL DEFAULT 'active', description varchar(500), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(owner_id, slug, environment))`
    )
    await q.query(`CREATE INDEX applications_owner_id_idx ON applications(owner_id)`)
    await q.query(
      `CREATE TABLE refresh_sessions (id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, token_hash varchar(255) NOT NULL, expires_at timestamptz NOT NULL, revoked_at timestamptz, user_agent varchar(500), ip_address varchar(64), created_at timestamptz NOT NULL DEFAULT now(), last_used_at timestamptz)`
    )
    await q.query(`CREATE INDEX refresh_sessions_user_id_idx ON refresh_sessions(user_id)`)
  }
  async down(q: QueryRunner): Promise<void> {
    await q.query('DROP TABLE refresh_sessions')
    await q.query('DROP TABLE applications')
    await q.query('DROP TABLE users')
  }
}
