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
  tagKinds,
  type StudentTag,
} from "../lib/students/contracts";

export {
  contactChannels,
  studentAvatarKeys,
  studentLevels,
  studentSources,
  studentThemeColors,
  tagKinds,
  type StudentTag,
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
    email: text("email").notNull(),
    phone: text("phone"),
    nationalityCode: text("nationality_code").notNull(),
    timeZone: text("time_zone").notNull(),
    preferredContactChannel: text("preferred_contact_channel", {
      enum: contactChannels,
    }).notNull(),
    contactDetails: text("contact_details"),
    level: text("level", { enum: studentLevels }).notNull(),
    preferences: text("preferences", { mode: "json" })
      .$type<StudentTag[]>()
      .default(sql`'[]'`)
      .notNull(),
    interests: text("interests", { mode: "json" })
      .$type<StudentTag[]>()
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
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
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
      table.deletedAt,
      table.isActive,
      table.updatedAt,
      table.id,
    ),
    index("student_teacher_status_name_idx").on(
      table.teacherId,
      table.deletedAt,
      table.isActive,
      table.normalizedName,
      table.id,
    ),
    check("student_hourly_rate_positive", sql`${table.hourlyRateMinor} > 0`),
  ],
);

export const teacherTagSuggestion = sqliteTable(
  "teacher_tag_suggestion",
  {
    id: text("id").primaryKey(),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: tagKinds }).notNull(),
    label: text("label").notNull(),
    normalizedLabel: text("normalized_label").notNull(),
    createdAt: timestamp("created_at"),
  },
  (table) => [
    uniqueIndex("teacher_tag_suggestion_unique").on(
      table.teacherId,
      table.kind,
      table.normalizedLabel,
    ),
    index("teacher_tag_suggestion_teacher_kind_idx").on(
      table.teacherId,
      table.kind,
    ),
  ],
);
