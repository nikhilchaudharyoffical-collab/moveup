import { z } from "zod";

const envSchema = z.object({
  NOWPAYMENTS_API_KEY: z.string().optional(),
  NOWPAYMENTS_IPN_SECRET: z.string().optional(),
  MERCHANT_WALLET_ADDRESS: z.string().optional(),
  ADMIN_PASSWORD: z.string().default("admin"),
  BOOK_TITLE: z.string().default("My Amazing Book"),
  BOOK_DESCRIPTION: z.string().default("A short description here"),
  BOOK_AUTHOR: z.string().default("Author Name"),
  BOOK_PRICE_USDT: z.coerce.number().default(5),
});

export const env = envSchema.parse(process.env);

