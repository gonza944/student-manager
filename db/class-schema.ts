import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

import { user } from "./schema";
import { student } from "./student-schema";

export const classStatuses = ["scheduled", "completed", "cancelled"] as const;

const timestamp = (name: string) =>
  integer(name, { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull();

export const studentClass = sqliteTable(
  "student_class",
  {
    id: text("id").primaryKey(),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    studentId: text("student_id")
      .notNull()
      .references(() => student.id, { onDelete: "no action" }),
    scheduledAt: integer("scheduled_at", { mode: "timestamp_ms" }).notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    hourlyRateSnapshotMinor: integer("hourly_rate_snapshot_minor").notNull(),
    currency: text("currency").notNull(),
    chargeMinor: integer("charge_minor").notNull(),
    status: text("status", { enum: classStatuses })
      .default("scheduled")
      .notNull(),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => [
    index("student_class_teacher_scheduled_idx").on(
      table.teacherId,
      table.scheduledAt,
      table.id,
    ),
    index("student_class_teacher_student_scheduled_idx").on(
      table.teacherId,
      table.studentId,
      table.scheduledAt,
      table.id,
    ),
    check(
      "student_class_duration_valid",
      sql`${table.durationMinutes} > 0 AND ${table.durationMinutes} % 5 = 0`,
    ),
    check(
      "student_class_hourly_rate_positive",
      sql`${table.hourlyRateSnapshotMinor} > 0`,
    ),
    check("student_class_charge_nonnegative", sql`${table.chargeMinor} >= 0`),
    check(
      "student_class_status_valid",
      sql`${table.status} IN ('scheduled', 'completed', 'cancelled')`,
    ),
  ],
);
