import assert from "node:assert/strict";
import { createRequire, type ResolveHook } from "node:module";
import test from "node:test";

type SqlValue = string | number;
type SqlRow = Record<string, SqlValue>;
type SqliteDatabase = {
  exec(sql: string): void;
  prepare(sql: string): {
    all(...values: SqlValue[]): SqlRow[];
    run(...values: SqlValue[]): void;
  };
  close(): void;
};

const require = createRequire(import.meta.url);
const { DatabaseSync } = require("node:sqlite") as {
  DatabaseSync: new (path: string) => SqliteDatabase;
};
const { registerHooks } = require("node:module") as {
  registerHooks(hooks: { resolve: ResolveHook }): { deregister(): void };
};

async function loadDashboardQueries() {
  const hook = registerHooks({
    resolve(specifier, context, nextResolve) {
      return nextResolve(
        specifier === "server-only"
          ? require.resolve("next/dist/compiled/server-only/empty")
          : specifier,
        context,
      );
    },
  });
  try {
    const { createDb } = await import("../../db");
    const { getTeacherDashboardMetrics } = await import("../../lib/dashboard/metrics");
    return { createDb, getTeacherDashboardMetrics };
  } finally {
    hook.deregister();
  }
}

test("dashboard totals use the teacher's local calendar and recorded class charges", async (t) => {
  const { createDb, getTeacherDashboardMetrics } = await loadDashboardQueries();
  const sqlite = new DatabaseSync(":memory:");
  t.after(() => sqlite.close());
  const binding = {
    prepare: (sql: string) => ({
      bind: (...values: SqlValue[]) => ({
        all: () => ({ results: sqlite.prepare(sql).all(...values) }),
      }),
    }),
    batch: async (statements: { all(): { results: SqlRow[] } }[]) =>
      statements.map((statement) => statement.all()),
  } as unknown as D1Database;

  sqlite.exec(`
    CREATE TABLE student (teacher_id TEXT, student_since TEXT);
    CREATE TABLE student_class (
      teacher_id TEXT, scheduled_at INTEGER, status TEXT,
      currency TEXT, charge_minor INTEGER, hourly_rate_snapshot_minor INTEGER
    );
    INSERT INTO student VALUES
      ('teacher', '2026-12-31'), ('teacher', '2027-01-01'),
      ('teacher', '2027-02-01'), ('other-teacher', '2027-01-01');
  `);
  const insertClass = sqlite.prepare("INSERT INTO student_class VALUES (?, ?, ?, ?, ?, 99999)");
  const classes = [
    ["teacher", "2026-12-01T02:59:59.999Z", "completed", "USD", 9999],
    ["teacher", "2026-12-01T03:00:00.000Z", "completed", "USD", 3900],
    ["teacher", "2027-01-01T02:59:59.999Z", "completed", "USD", 1000],
    ["teacher", "2027-01-01T03:00:00.000Z", "completed", "USD", 11200],
    ["teacher", "2027-01-01T07:00:00.000Z", "cancelled", "USD", 2500],
    ["teacher", "2027-01-01T08:00:00.000Z", "scheduled", "USD", 5000],
    ["teacher", "2027-01-02T02:59:59.999Z", "completed", "EUR", 3500],
    ["teacher", "2027-01-02T03:00:00.000Z", "completed", "USD", 875],
    ["teacher", "2027-02-01T03:00:00.000Z", "completed", "USD", 9999],
    ["other-teacher", "2027-01-01T10:00:00.000Z", "completed", "USD", 9999],
  ] as const;
  for (const [teacher, scheduledAt, status, currency, charge] of classes) {
    insertClass.run(teacher, Date.parse(scheduledAt), status, currency, charge);
  }

  const db = createDb(binding);
  const timeZone = "America/Argentina/Cordoba";
  const now = new Date("2027-01-01T12:00:00.000Z");
  assert.deepEqual(await getTeacherDashboardMetrics(db, "teacher", timeZone, now), {
    newStudentsThisMonth: 1,
    classesThisMonth: 4,
    classesToday: 3,
    previousMonthStart: new Date("2026-12-01T03:00:00.000Z"),
    revenue: [
      { currency: "EUR", currentMinor: 3500, previousMinor: 0 },
      { currency: "USD", currentMinor: 12075, previousMinor: 4900 },
    ],
  });
  const beforeLocalMidnight = new Date("2027-01-01T02:59:59.999Z");
  assert.deepEqual(await getTeacherDashboardMetrics(db, "teacher", timeZone, beforeLocalMidnight), {
    newStudentsThisMonth: 1,
    classesThisMonth: 2,
    classesToday: 1,
    previousMonthStart: new Date("2026-11-01T03:00:00.000Z"),
    revenue: [{ currency: "USD", currentMinor: 4900, previousMinor: 9999 }],
  });
  assert.deepEqual(await getTeacherDashboardMetrics(db, "no-classes", timeZone, now), {
    newStudentsThisMonth: 0,
    classesThisMonth: 0,
    classesToday: 0,
    previousMonthStart: new Date("2026-12-01T03:00:00.000Z"),
    revenue: [],
  });
});
