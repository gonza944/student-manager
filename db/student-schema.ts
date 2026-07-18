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

export const studentSources = ["private", "preply"] as const;
export const contactChannels = [
  "email",
  "phone",
  "whatsapp",
  "telegram",
  "zoom",
  "other",
] as const;
export const studentLevels = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export const studentThemeColors = [
  "coral",
  "gold",
  "mint",
  "sky",
  "violet",
  "rose",
] as const;
export const studentAvatarKeys = [
  "avatar-01",
  "avatar-02",
  "avatar-03",
  "avatar-04",
  "avatar-05",
  "avatar-06",
  "avatar-07",
  "avatar-08",
  "avatar-09",
  "avatar-10",
  "avatar-11",
  "avatar-12",
  "avatar-13",
  "avatar-14",
  "avatar-15",
  "avatar-16",
  "avatar-17",
  "avatar-18",
  "avatar-19",
  "avatar-20",
  "avatar-21",
  "avatar-22",
  "avatar-23",
  "avatar-24",
  "avatar-25",
  "avatar-26",
  "avatar-27",
  "avatar-28",
  "avatar-29",
  "avatar-30",
  "avatar-31",
  "avatar-32",
] as const;
export const tagKinds = ["preference", "interest"] as const;

export type StudentTag =
  | { type: "builtin"; key: string }
  | { type: "custom"; label: string };

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
