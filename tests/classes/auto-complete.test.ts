import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import {
  completeClassesOnSchedule,
  completeFinishedClasses,
} from "../../lib/classes/auto-complete";

const { DatabaseSync } = createRequire(import.meta.url)("node:sqlite") as {
  DatabaseSync: new (path: string) => {
    exec: (sql: string) => void;
    close: () => void;
    prepare: (sql: string) => {
      all: (...params: unknown[]) => Record<string, unknown>[];
      run: (...params: unknown[]) => { changes: number | bigint };
    };
  };
};

test("daily scheduled handler completes only ended scheduled intervals and is idempotent", async () => {
  const db = new DatabaseSync(":memory:");
  const midnight = Date.parse("2026-11-20T00:00:00Z");
  db.exec(`CREATE TABLE student_class (
    id TEXT PRIMARY KEY, teacher_id TEXT, status TEXT,
    scheduled_at INTEGER, duration_minutes INTEGER,
    charge_minor INTEGER, currency TEXT, hourly_rate_snapshot_minor INTEGER,
    created_at INTEGER, updated_at INTEGER
  )`);
  const insert = db.prepare(
    "INSERT INTO student_class VALUES (?, ?, ?, ?, ?, 501, 'USD', 1001, 10, ?)",
  );
  insert.run("ended", "teacher-a", "scheduled", midnight - 7200000, 60, 20);
  insert.run("boundary", "teacher-b", "scheduled", midnight - 3600000, 60, 20);
  insert.run("ongoing", "teacher-a", "scheduled", midnight - 1800000, 60, 20);
  insert.run("future", "teacher-a", "scheduled", midnight + 3600000, 60, 20);
  insert.run("cancelled", "teacher-a", "cancelled", midnight - 7200000, 60, 20);
  insert.run("completed", "teacher-a", "completed", midnight - 7200000, 60, 20);
  insert.run(
    "newer-update",
    "teacher-b",
    "scheduled",
    midnight - 7200000,
    60,
    midnight + 1000,
  );
  const rows = () =>
    db
      .prepare("SELECT * FROM student_class ORDER BY id")
      .all()
      .map((row) => ({ ...row }));
  const before = rows();
  const binding = {
    prepare: (sql: string) => ({
      bind: (...values: number[]) => ({
        run: async () => ({
          meta: { changes: Number(db.prepare(sql).run(...values).changes) },
        }),
      }),
    }),
  } as unknown as D1Database;
  try {
    await completeClassesOnSchedule(
      { scheduledTime: midnight, cron: "0 0 * * *" },
      { DB: binding },
    );
    const after = rows();
    const changed = new Set(["ended", "boundary", "newer-update"]);
    for (const row of before) {
      assert.deepEqual(
        after.find((item) => item.id === row.id),
        changed.has(String(row.id))
          ? {
              ...row,
              status: "completed",
              updated_at: Math.max(Number(row.updated_at), midnight),
            }
          : row,
      );
    }
    assert.equal(await completeFinishedClasses(binding, midnight), 0);
    assert.deepEqual(rows(), after);
    await assert.rejects(
      completeFinishedClasses(binding, NaN),
      /Invalid scheduled time/,
    );
    await assert.rejects(
      completeFinishedClasses(binding, -1),
      /Invalid scheduled time/,
    );
  } finally {
    db.close();
  }
});
