import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().trim().min(3).max(40),
  email: z.email().trim().toLowerCase(),
  password: z.string().trim().min(3),
});

export const updateUserSchema = createUserSchema.partial();
