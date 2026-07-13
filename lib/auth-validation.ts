import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.string().trim().check(z.email()),
  password: z.string().min(8),
});

export const signupSchema = credentialsSchema.extend({
  name: z.string().trim().min(1),
});
