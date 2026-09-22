import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

type TestStatement = {
  all: (...params: unknown[]) => Record<string, string | number>[];
  get: (...params: unknown[]) => Record<string, string | number> | undefined;
  run: (...params: unknown[]) => void;
};
type TestDatabase = {
  close: () => void;
  exec: (sql: string) => void;
  prepare: (sql: string) => TestStatement;
};

const { DatabaseSync } = createRequire(import.meta.url)("node:sqlite") as {
  DatabaseSync: new (path: string) => TestDatabase;
};

const at = (time: string) => Date.parse(`2026-09-01T${time}:00.000Z`);

function insertClass(
  db: TestDatabase,
  {
    id,
    teacherId = "teacher-1",
    studentId = "student-1",
    scheduledAt,
    durationMinutes = 60,
    status = "scheduled",
  }: {
    id: string;
    teacherId?: string;
    studentId?: string;
    scheduledAt: number;
    durationMinutes?: number;
    status?: "scheduled" | "completed" | "cancelled";
  },
) {
  db.prepare(`
    INSERT INTO student_class (
      id, teacher_id, student_id, scheduled_at, duration_minutes,
      hourly_rate_snapshot_minor, currency, charge_minor, status
    ) VALUES (?, ?, ?, ?, ?, 1001, 'USD', 501, ?)
  `).run(id, teacherId, studentId, scheduledAt, durationMinutes, status);
}

test("adds race-safe class intervals without changing existing rows", () => {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    PRAGMA foreign_keys=ON;
    CREATE TABLE user (id text PRIMARY KEY NOT NULL);
    CREATE TABLE student (
      id text PRIMARY KEY NOT NULL,
      teacher_id text NOT NULL REFERENCES user(id) ON DELETE cascade
    );
    INSERT INTO user (id) VALUES ('teacher-1'), ('teacher-2');
    INSERT INTO student (id, teacher_id)
    VALUES ('student-1', 'teacher-1'), ('student-2', 'teacher-1'),
      ('student-3', 'teacher-2');
  `);

  const migration = readFileSync(
    new URL("../../drizzle/0009_clean_dust.sql", import.meta.url),
    "utf8",
  ).replaceAll("--> statement-breakpoint", "");
  db.exec(migration);

  insertClass(db, { id: "primary", scheduledAt: at("10:00") });

  assert.throws(
    () =>
      insertClass(db, {
        id: "overlap",
        studentId: "student-2",
        scheduledAt: at("10:30"),
      }),
    /interval overlaps/,
  );

  insertClass(db, { id: "back-to-back", scheduledAt: at("11:00") });
  insertClass(db, {
    id: "other-teacher",
    teacherId: "teacher-2",
    studentId: "student-3",
    scheduledAt: at("10:30"),
  });
  insertClass(db, {
    id: "cancelled",
    studentId: "student-2",
    scheduledAt: at("10:30"),
    status: "cancelled",
  });
  insertClass(db, {
    id: "released",
    studentId: "student-2",
    scheduledAt: at("12:00"),
    status: "cancelled",
  });
  insertClass(db, {
    id: "reused",
    studentId: "student-2",
    scheduledAt: at("12:00"),
  });

  assert.throws(
    () =>
      db.exec(
        "UPDATE student_class SET status = 'completed' WHERE id = 'cancelled'",
      ),
    /interval overlaps/,
  );
  assert.throws(
    () =>
      db.exec(
        "UPDATE student_class SET hourly_rate_snapshot_minor = 2000 WHERE id = 'primary'",
      ),
    /rate snapshot is immutable/,
  );
  assert.throws(
    () =>
      insertClass(db, {
        id: "wrong-owner",
        teacherId: "teacher-2",
        studentId: "student-1",
        scheduledAt: at("13:00"),
      }),
    /teacher does not own student/,
  );
  assert.throws(
    () => db.exec("DELETE FROM student WHERE id = 'student-1'"),
    /FOREIGN KEY constraint failed/,
  );

  db.exec("DELETE FROM user WHERE id = 'teacher-2'");
  assert.equal(
    db.prepare(
      "SELECT count(*) AS count FROM student_class WHERE teacher_id = 'teacher-2'",
    ).get()?.count,
    0,
  );
  assert.equal(
    db.prepare("SELECT count(*) AS count FROM student").get()?.count,
    2,
  );
  assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);

  db.close();
});
