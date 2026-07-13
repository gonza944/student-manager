import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth/minimal";

import type { createDb } from "@/db";
import * as schema from "@/db/schema";

export const userRoles = ["teacher", "student"] as const;
export type UserRole = (typeof userRoles)[number];

type Database = ReturnType<typeof createDb>;

export function createAuth(
  db: Database,
  config: { baseURL: string; secret: string },
) {
  return betterAuth({
    appName: "Student Manager",
    ...config,
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema,
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
    },
    user: {
      additionalFields: {
        role: {
          type: [...userRoles],
          required: true,
          defaultValue: "student",
          input: true,
        },
      },
    },
    rateLimit: {
      enabled: true,
      storage: "database",
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
