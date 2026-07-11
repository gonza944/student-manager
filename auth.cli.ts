import { drizzle } from "drizzle-orm/d1";

import * as schema from "@/db/schema";
import { createAuth } from "@/lib/auth/config";

const db = drizzle({} as D1Database, { schema });

export const auth = createAuth(db, {
  baseURL: "http://localhost:3000",
  secret: "schema-generation-only-secret-not-used-at-runtime",
});
