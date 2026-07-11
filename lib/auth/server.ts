import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { headers } from "next/headers";

import { createDb } from "@/db";
import { createAuth, type UserRole } from "./config";

export async function getAuth() {
  const { env } = await getCloudflareContext({ async: true });

  return createAuth(createDb(env.DB), {
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
  });
}

export async function getSession() {
  return (await getAuth()).api.getSession({ headers: await headers() });
}

export async function requireRole(role: UserRole) {
  const session = await getSession();

  if (!session) return { error: "unauthenticated" } as const;
  if (session.user.role !== role) return { error: "forbidden" } as const;

  return { session } as const;
}
