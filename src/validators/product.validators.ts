import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().trim().min(1).max(256),
  description: z.string().optional(),
  sku: z.string().trim().min(1).max(256),
  quantity: z.number().int().min(0).default(0),
});

export const updateProductSchema = createProductSchema.partial();
