import type { z } from "zod";

export function validateSchema<T>(schema: z.ZodSchema<T>, input: unknown): T {
  return schema.parse(input);
}
