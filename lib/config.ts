import { z } from 'zod';

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});
const serverSchema = publicSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  STRIPE_PRICE_30D: z.string().startsWith('price_'),
  STRIPE_PRICE_90D: z.string().startsWith('price_'),
  STRIPE_PRICE_365D: z.string().startsWith('price_'),
  APP_BASE_URL: z.string().url(),
});
function parseOrThrow<T extends z.ZodType>(schema: T, source: Record<string, unknown>): z.infer<T> {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    const keys = parsed.error.issues.map((i) => i.path.join('.')).join(', ');
    throw new Error(`Missing or invalid environment configuration: ${keys}`);
  }
  return parsed.data;
}
export function getPublicEnv() {
  return parseOrThrow(publicSchema, process.env);
}
export function getServerEnv() {
  return parseOrThrow(serverSchema, process.env);
}
export const tierConfig = {
  starter: { label: 'Starter', days: 30, priceEnv: 'STRIPE_PRICE_30D', amountHint: '£990', expectedAmount: 99000 },
  professional: { label: 'Professional', days: 90, priceEnv: 'STRIPE_PRICE_90D', amountHint: '£2,490', expectedAmount: 249000 },
  annual: { label: 'Annual', days: 365, priceEnv: 'STRIPE_PRICE_365D', amountHint: '£7,490', expectedAmount: 749000 },
} as const;
export type TierId = keyof typeof tierConfig;
export function isTierId(value: unknown): value is TierId {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(tierConfig, value);
}
