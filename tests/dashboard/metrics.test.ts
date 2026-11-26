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

test("dashboard revenue uses the teacher's local calendar, recorded charges, and each class's historical source and fee", async (t) => {
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
    CREATE TABLE student (id TEXT PRIMARY KEY, teacher_id TEXT, student_since TEXT, source TEXT NOT NULL);
    CREATE TABLE student_class (
      teacher_id TEXT, student_id TEXT, scheduled_at INTEGER, status TEXT,
      currency TEXT, charge_minor INTEGER, hourly_rate_snapshot_minor INTEGER
    );
    CREATE TABLE student_rate_history (
      id TEXT PRIMARY KEY, teacher_id TEXT, student_id TEXT, effective_at INTEGER, fee_bps INTEGER, source TEXT
    );
    INSERT INTO student VALUES
      ('platform', 'teacher', '2026-12-31', 'private'),
      ('direct', 'teacher', '2027-01-01', 'private'),
      ('future', 'teacher', '2027-02-01', 'private'),
      ('other-direct', 'teacher', '2026-11-01', 'private'),
      ('other-platform', 'other-teacher', '2027-01-01', 'preply');
  `);
  const insertRate = sqlite.prepare("INSERT INTO student_rate_history VALUES (?, ?, ?, ?, ?, ?)");
  const rates = [
    ["initial", "teacher", "platform", "2026-12-01T03:00:00.000Z", 2000, "preply"],
    ["same-time-preply", "teacher", "platform", "2027-01-02T03:00:00.000Z", 3000, "preply"],
    ["same-time-direct", "teacher", "platform", "2027-01-02T03:00:00.000Z", 1000, "private"],
    ["other-teacher-rate", "other-teacher", "platform", "2027-01-02T03:00:00.000Z", 10000, "preply"],
    ["later-rate", "teacher", "direct", "2027-01-02T03:00:00.000Z", 10000, "preply"],
    ["other-direct-rate", "teacher", "other-direct", "2026-12-01T03:00:00.000Z", 1000, "private"],
  ] as const;
  for (const [id, teacher, student, effectiveAt, feeBps, source] of rates) {
    insertRate.run(id, teacher, student, Date.parse(effectiveAt), feeBps, source);
  }

  const insertClass = sqlite.prepare("INSERT INTO student_class VALUES (?, ?, ?, ?, ?, ?, 99999)");
  const classes = [
    ["teacher", "2026-12-01T02:59:59.999Z", "completed", "USD", 9999],
    ["teacher", "2026-12-01T03:00:00.000Z", "completed", "USD", 3900],
    ["teacher", "2027-01-01T02:59:59.999Z", "completed", "USD", 1000],
    ["teacher", "2027-01-01T03:00:00.000Z", "completed", "USD", 11200],
    ["teacher", "2027-01-01T07:00:00.000Z", "cancelled", "USD", 2500],
    ["teacher", "2027-01-01T08:00:00.000Z", "scheduled", "USD", 5000],
    ["teacher", "2027-01-02T02:59:59.999Z", "completed", "EUR", 3500, "direct"],
    ["teacher", "2027-01-02T03:00:00.000Z", "completed", "USD", 875],
    ["teacher", "2027-01-02T04:00:00.000Z", "completed", "USD", 875, "other-direct"],
    ["teacher", "2027-02-01T03:00:00.000Z", "completed", "USD", 9999],
    ["other-teacher", "2027-01-01T10:00:00.000Z", "completed", "USD", 9999, "other-platform"],
  ] as const;
  for (const [teacher, scheduledAt, status, currency, charge, student = "platform"] of classes) {
    insertClass.run(teacher, student, Date.parse(scheduledAt), status, currency, charge);
  }

  const db = createDb(binding);
  const timeZone = "America/Argentina/Cordoba";
  const now = new Date("2027-01-01T12:00:00.000Z");
  assert.deepEqual(await getTeacherDashboardMetrics(db, "teacher", timeZone, now), {
    newStudentsThisMonth: 1,
    classesThisMonth: 5,
    classesToday: 3,
    previousMonthStart: new Date("2026-12-01T03:00:00.000Z"),
    revenue: [
      {
        currency: "EUR",
        currentGrossMinor: 3500,
        currentNetMinor: 3500,
        currentGrossMinorBySource: { preply: 0, private: 3500 },
        currentNetMinorBySource: { preply: 0, private: 3500 },
        previousGrossMinor: 0,
      },
      {
        currency: "USD",
        currentGrossMinor: 12950,
        currentNetMinor: 10534,
        currentGrossMinorBySource: { preply: 11200, private: 1750 },
        currentNetMinorBySource: { preply: 8960, private: 1574 },
        previousGrossMinor: 4900,
      },
    ],
  });
  const beforeLocalMidnight = new Date("2027-01-01T02:59:59.999Z");
  assert.deepEqual(await getTeacherDashboardMetrics(db, "teacher", timeZone, beforeLocalMidnight), {
    newStudentsThisMonth: 1,
    classesThisMonth: 2,
    classesToday: 1,
    previousMonthStart: new Date("2026-11-01T03:00:00.000Z"),
    revenue: [
      {
        currency: "USD",
        currentGrossMinor: 4900,
        currentNetMinor: 3920,
        currentGrossMinorBySource: { preply: 4900, private: 0 },
        currentNetMinorBySource: { preply: 3920, private: 0 },
        previousGrossMinor: 9999,
      },
    ],
  });
  assert.deepEqual(await getTeacherDashboardMetrics(db, "no-classes", timeZone, now), {
    newStudentsThisMonth: 0,
    classesThisMonth: 0,
    classesToday: 0,
    previousMonthStart: new Date("2026-12-01T03:00:00.000Z"),
    revenue: [],
  });
});
