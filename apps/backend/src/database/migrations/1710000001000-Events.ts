import { MigrationInterface, QueryRunner } from 'typeorm'

export class Events1710000001000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    await q.query(
      `CREATE TABLE events (id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), event_id varchar(120) NOT NULL UNIQUE, application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE, environment varchar(30) NOT NULL, event_type varchar(50) NOT NULL, timestamp timestamptz NOT NULL, received_at timestamptz NOT NULL DEFAULT now(), session_id varchar(120), sdk_name varchar(80), sdk_version varchar(40), release varchar(120), context jsonb NOT NULL DEFAULT '{}'::jsonb, payload jsonb NOT NULL DEFAULT '{}'::jsonb)`
    )
    await q.query(
      'CREATE INDEX events_application_environment_timestamp_idx ON events(application_id, environment, timestamp)'
    )
    await q.query('CREATE INDEX events_application_event_type_idx ON events(application_id, event_type)')
  }
  async down(q: QueryRunner): Promise<void> {
    await q.query('DROP TABLE events')
  }
}
