import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function createDb(binding: D1Database) {
  return drizzle(binding, { schema });
}

export async function getDb() {
  const { env } = await getCloudflareContext({ async: true });

  return createDb(env.DB);
}
