// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- Module existence depends on the OpenNext build stage.
// @ts-ignore OpenNext generates this module during the Cloudflare build.
import handler from "./.open-next/worker.js";
import { completeClassesOnSchedule } from "./lib/classes/auto-complete";

export default {
  fetch: handler.fetch,
  scheduled: completeClassesOnSchedule,
} satisfies ExportedHandler<CloudflareEnv>;
