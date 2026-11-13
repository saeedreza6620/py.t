import { sqliteTable, text, integer, real, index, uniqueIndex } from "drizzle-orm/sqlite-core";

/** کاربر: تراشکار (فروشنده)، خریدار عمده (ریخته‌گری/کارخانه) یا مدیر */
export const users = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    phone: text("phone").notNull(),
    role: text("role", { enum: ["workshop", "buyer", "admin"] }).notNull(),
    name: text("name").notNull().default(""),
    status: text("status", { enum: ["active", "pending", "blocked"] }).notNull().default("active"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [uniqueIndex("users_phone_idx").on(t.phone)],
);

export const zones = sqliteTable("zones", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const workshops = sqliteTable("workshops", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  zoneId: integer("zone_id").notNull().references(() => zones.id),
  address: text("address").notNull().default(""),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  sheba: text("sheba").notNull().default(""),
  /** تعداد تخلف‌های ثبت‌شده (مغایرت عمدی) */
  strikes: integer("strikes").notNull().default(0),
  penaltyToman: integer("penalty_toman").notNull().default(0),
  createdAt: integer("created_at").notNull(),
});

export const buyers = sqliteTable("buyers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  company: text("company").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  hasSpectrometer: integer("has_spectrometer", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at").notNull(),
});

/** گرید ضایعات؛ ضریب نسبت به قیمت پایه کاتد مس */
export const grades = sqliteTable("grades", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  family: text("family", { enum: ["brass", "copper"] }).notNull(),
  coef: real("coef").notNull(),
  description: text("description").notNull().default(""),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  sort: integer("sort").notNull().default(0),
});

/** بار تجمیعی (مگا-بار): در یک منطقه و یک گرید پر می‌شود */
export const batches = sqliteTable(
  "batches",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    zoneId: integer("zone_id").notNull().references(() => zones.id),
    gradeId: text("grade_id").notNull().references(() => grades.id),
    status: text("status", {
      enum: ["filling", "ready", "sold", "settled", "cancelled"],
    }).notNull().default("filling"),
    minWorkshops: integer("min_workshops").notNull(),
    targetKg: integer("target_kg").notNull(),
    buyerId: integer("buyer_id").references(() => buyers.id),
    lockedPricePerKg: integer("locked_price_per_kg"),
    lockedUsd: integer("locked_usd"),
    lockedCathode: integer("locked_cathode"),
    commissionPct: real("commission_pct"),
    createdAt: integer("created_at").notNull(),
    readyAt: integer("ready_at"),
    soldAt: integer("sold_at"),
    settledAt: integer("settled_at"),
  },
  (t) => [index("batches_status_idx").on(t.status)],
);

/** اعلام بار یک کارگاه */
export const loads = sqliteTable(
  "loads",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    workshopId: integer("workshop_id").notNull().references(() => workshops.id),
    batchId: integer("batch_id").notNull().references(() => batches.id),
    gradeId: text("grade_id").notNull().references(() => grades.id),
    estKg: integer("est_kg").notNull(),
    oilLevel: text("oil_level", { enum: ["dry", "light", "wet"] }).notNull(),
    note: text("note").notNull().default(""),
    status: text("status", {
      enum: ["waiting", "picked", "rejected", "cancelled"],
    }).notNull().default("waiting"),
    actualKg: real("actual_kg"),
    actualOil: text("actual_oil", { enum: ["dry", "light", "wet"] }),
    discrepancy: text("discrepancy"),
    payableToman: integer("payable_toman"),
    createdAt: integer("created_at").notNull(),
    pickedAt: integer("picked_at"),
  },
  (t) => [index("loads_batch_idx").on(t.batchId), index("loads_ws_idx").on(t.workshopId)],
);

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const priceSnapshots = sqliteTable("price_snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ts: integer("ts").notNull(),
  usd: integer("usd").notNull(),
  cathode: integer("cathode").notNull(),
  usdSource: text("usd_source").notNull(),
});

export const otps = sqliteTable("otps", {
  phone: text("phone").primaryKey(),
  codeHash: text("code_hash").notNull(),
  expiresAt: integer("expires_at").notNull(),
  attempts: integer("attempts").notNull().default(0),
});

export type Grade = typeof grades.$inferSelect;
export type Batch = typeof batches.$inferSelect;
export type Load = typeof loads.$inferSelect;
export type Workshop = typeof workshops.$inferSelect;
export type Buyer = typeof buyers.$inferSelect;
export type User = typeof users.$inferSelect;
export type Zone = typeof zones.$inferSelect;
