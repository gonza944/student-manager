import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: [
    "./db/schema.ts",
    "./db/student-schema.ts",
    "./db/class-schema.ts",
  ],
  out: "./drizzle",
});
