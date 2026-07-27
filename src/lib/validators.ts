import { z } from "zod";

export const createEmployeeSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  name: z.string().min(1, "Name is required."),
  role: z.enum(["SALESMAN", "TELECALLER", "WAREHOUSE", "ADMIN"]),
  phone: z.string().optional(),
});

export const createRouteSchema = z.object({
  name: z.string().min(1, "Route name is required."),
  description: z.string().optional(),
});

export const assignRouteSchema = z.object({
  userId: z.string().min(1),
  routeId: z.string().min(1),
});

export const NO_ORDER_REASONS = [
  "STORE_CLOSED",
  "NO_STOCK_NEEDED",
  "OWNER_NOT_AVAILABLE",
  "PAYMENT_DISPUTE",
  "COMPETITOR_STOCKED",
  "OTHER",
] as const;

// FormData.get() returns null for fields not present in the DOM (e.g. a
// conditionally-rendered input), but z.string().optional() only accepts
// string | undefined — null fails validation. Normalize "" and null alike.
const emptyToUndefined = (val: unknown) => (val === "" || val == null ? undefined : val);
const optionalNumber = z.preprocess(emptyToUndefined, z.coerce.number().optional());
const optionalString = z.preprocess(emptyToUndefined, z.string().optional());
const optionalNoOrderReason = z.preprocess(emptyToUndefined, z.enum(NO_ORDER_REASONS).optional());
// Radio values arrive as the literal strings "true"/"false" — z.coerce.boolean()
// would incorrectly coerce "false" to true, since Boolean("false") is truthy.
const booleanFromRadio = z.enum(["true", "false"]).transform((v) => v === "true");

export const createWarehouseTaskSchema = z.object({
  title: z.string().min(1, "Title is required."),
  description: optionalString,
  recurrence: z.enum(["WEEKLY", "MONTHLY"]),
  dayOfWeek: optionalNumber,
  dayOfMonth: optionalNumber,
});

export const telecallerLogSchema = z.object({
  storeId: z.string().min(1),
  orderAmount: optionalNumber,
  paymentPromise: optionalString,
  collectionAmount: optionalNumber,
  hasOrder: booleanFromRadio,
  noOrderReason: optionalNoOrderReason,
  noPaymentReason: optionalString,
  complaintNotes: optionalString,
});

export const visitSchema = z.object({
  storeId: z.string().min(1),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  collectionAmount: optionalNumber,
  orderAmount: optionalNumber,
  hasOrder: booleanFromRadio,
  hasDiscount: booleanFromRadio,
  noOrderReason: optionalNoOrderReason,
  notes: optionalString,
});
