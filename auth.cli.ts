import { drizzle } from "drizzle-orm/d1";

import * as authSchema from "@/db/schema";
import * as studentSchema from "@/db/student-schema";
import { createAuth } from "@/lib/auth/config";

const schema = { ...authSchema, ...studentSchema };
const db = drizzle({} as D1Database, { schema });

export const auth = createAuth(db, {
  baseURL: "http://localhost:3000",
  secret: "schema-generation-only-secret-not-used-at-runtime",
});
