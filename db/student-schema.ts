import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

import { user } from "./schema";
import {
  contactChannels,
  studentAvatarKeys,
  studentLevels,
  studentSources,
  studentThemeColors,
} from "../lib/students/contracts";

export {
  contactChannels,
  studentAvatarKeys,
  studentLevels,
  studentSources,
  studentThemeColors,
};

const timestamp = (name: string) =>
  integer(name, { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull();

export const student = sqliteTable(
  "student",
  {
    id: text("id").primaryKey(),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    email: text("email"),
    phone: text("phone"),
    birthDate: text("birth_date"),
    nationalityCode: text("nationality_code").notNull(),
    timeZone: text("time_zone").notNull(),
    preferredContactChannel: text("preferred_contact_channel", {
      enum: contactChannels,
    }).notNull(),
    level: text("level", { enum: studentLevels }).notNull(),
    preferences: text("preferences", { mode: "json" })
      .$type<string[]>()
      .default(sql`'[]'`)
      .notNull(),
    interests: text("interests", { mode: "json" })
      .$type<string[]>()
      .default(sql`'[]'`)
      .notNull(),
    learningGoals: text("learning_goals"),
    source: text("source", { enum: studentSources }).notNull(),
    hourlyRateMinor: integer("hourly_rate_minor").notNull(),
    isActive: integer("is_active", { mode: "boolean" })
      .default(true)
      .notNull(),
    avatarKey: text("avatar_key", { enum: studentAvatarKeys }).notNull(),
    themeColor: text("theme_color", { enum: studentThemeColors }).notNull(),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("student_teacher_email_unique").on(
      table.teacherId,
      table.email,
    ),
    index("student_teacher_status_updated_idx").on(
      table.teacherId,
      table.isActive,
      table.updatedAt,
      table.id,
    ),
    index("student_teacher_status_name_idx").on(
      table.teacherId,
      table.isActive,
      table.normalizedName,
      table.id,
    ),
    check("student_hourly_rate_positive", sql`${table.hourlyRateMinor} > 0`),
  ],
);
