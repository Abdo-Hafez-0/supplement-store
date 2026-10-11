import { z } from "zod";

// Cart requests carry product ids and quantities only, never prices (CLAUDE.md rule 2).

export const MAX_LINE_QUANTITY = 999;

export const addToCartSchema = z.strictObject({
  productId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(MAX_LINE_QUANTITY),
});

export const setQuantitySchema = z.strictObject({
  quantity: z.number().int().min(0).max(MAX_LINE_QUANTITY),
});

export const setBumpSchema = z.strictObject({ accept: z.boolean() });

export const lineIdSchema = z.string().regex(/^\d{1,12}$/).transform(Number).pipe(z.number().int().positive());
