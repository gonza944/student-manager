import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

type TestDatabase = {
  exec: (sql: string) => void;
  prepare: (sql: string) => {
    get: () => Record<string, string | number> | undefined;
    all: () => Record<string, string | number>[];
  };
  close: () => void;
};

const { DatabaseSync } = createRequire(import.meta.url)("node:sqlite") as {
  DatabaseSync: new (path: string) => TestDatabase;
};

test("backfills studentSince and extends only the oldest rate", () => {
  const db = new DatabaseSync(":memory:");

  db.exec(`
    CREATE TABLE user (id text PRIMARY KEY NOT NULL);
    CREATE TABLE student (
      id text PRIMARY KEY NOT NULL,
      teacher_id text NOT NULL,
      name text NOT NULL,
      normalized_name text NOT NULL,
      email text,
      phone text,
      birth_date text,
      nationality_code text NOT NULL,
      time_zone text NOT NULL,
      preferred_contact_channel text NOT NULL,
      level text NOT NULL,
      preferences text DEFAULT '[]' NOT NULL,
      interests text DEFAULT '[]' NOT NULL,
      learning_goals text,
      source text NOT NULL,
      hourly_rate_minor integer NOT NULL,
      is_active integer DEFAULT true NOT NULL,
      avatar_key text NOT NULL,
      theme_color text NOT NULL,
      created_at integer NOT NULL,
      updated_at integer NOT NULL,
      FOREIGN KEY (teacher_id) REFERENCES user(id) ON DELETE cascade
    );
    CREATE TABLE student_rate_history (
      id text PRIMARY KEY NOT NULL,
      student_id text NOT NULL,
      teacher_id text NOT NULL,
      gross_rate_minor integer NOT NULL,
      fee_bps integer NOT NULL,
      fee_amount_minor integer NOT NULL,
      net_rate_minor integer NOT NULL,
      source text NOT NULL,
      effective_at integer NOT NULL,
      FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE cascade,
      FOREIGN KEY (teacher_id) REFERENCES user(id) ON DELETE cascade
    );
    INSERT INTO user (id) VALUES ('teacher-1');
    INSERT INTO student (
      id, teacher_id, name, normalized_name, nationality_code, time_zone,
      preferred_contact_channel, level, source, hourly_rate_minor, avatar_key,
      theme_color, created_at, updated_at
    ) VALUES (
      'student-1', 'teacher-1', 'Student', 'student', 'AR',
      'America/Argentina/Cordoba', 'other', 'B1', 'private', 1000,
      'avatar-01', 'coral',
      CAST(strftime('%s', '2026-08-20T01:30:00Z') AS integer) * 1000,
      CAST(strftime('%s', '2026-08-20T01:30:00Z') AS integer) * 1000
    );
    INSERT INTO student_rate_history (
      id, student_id, teacher_id, gross_rate_minor, fee_bps,
      fee_amount_minor, net_rate_minor, source, effective_at
    ) VALUES
      ('rate-old', 'student-1', 'teacher-1', 1000, 485, 49, 951, 'private',
       CAST(strftime('%s', '2026-08-20T01:30:00Z') AS integer) * 1000),
      ('rate-new', 'student-1', 'teacher-1', 1200, 485, 58, 1142, 'private',
       CAST(strftime('%s', '2026-08-21T12:00:00Z') AS integer) * 1000);
  `);

  const migration = readFileSync(
    new URL("../../drizzle/0008_unusual_terror.sql", import.meta.url),
    "utf8",
  ).replaceAll("--> statement-breakpoint", "");
  db.exec(migration);

  const student = db.prepare(`
      SELECT student_since AS studentSince, user.time_zone AS teacherTimeZone
      FROM student JOIN user ON user.id = student.teacher_id
    `).get();
  assert.equal(student?.studentSince, "2026-08-19");
  assert.equal(student?.teacherTimeZone, "America/Argentina/Cordoba");
  assert.deepEqual(
    db.prepare(`
      SELECT id, strftime('%Y-%m-%dT%H:%M:%SZ', effective_at / 1000, 'unixepoch') AS effectiveAt
      FROM student_rate_history ORDER BY effective_at, rowid
    `).all().map((row) => ({ ...row })),
    [
      { id: "rate-old", effectiveAt: "2026-08-19T03:00:00Z" },
      { id: "rate-new", effectiveAt: "2026-08-21T12:00:00Z" },
    ],
  );
  assert.equal(
    db.prepare(`
      SELECT "notnull" AS required
      FROM pragma_table_info('student') WHERE name = 'student_since'
    `).get()?.required,
    1,
  );
  assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);

  db.close();
});
