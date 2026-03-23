import { z } from "zod";

export const createPurchasedProductSchema = z.object({
  userId: z.number().int().positive(),
  productId: z.number().int().positive(),
  quantity: z.number().int().min(1),
});

export const updatePurchasedProductSchema = createPurchasedProductSchema.partial();
