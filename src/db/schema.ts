import { pgTable } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: t.timestamp("created_at").defaultNow().notNull(),
  updatedAt: t.timestamp("updated_at").$onUpdateFn(() => new Date()),
  deletedAt: t.timestamp("deleted_at"),
};

export const rolesEnum = t.pgEnum("user_roles", ["user", "seller", "admin"]);

export const userTable = pgTable("users", {
  id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
  name: t.varchar({ length: 256 }).notNull(),
  email: t.varchar({ length: 256 }).notNull().unique(),
  password: t.varchar({ length: 36 }).notNull(),
  roles: rolesEnum().default("user"),
  ...timestamps,
});

export const productTable = pgTable("products", {
  id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
  name: t.varchar({ length: 256 }).notNull(),
  description: t.text(),
  sku: t.varchar({ length: 256 }).notNull().unique(),
  quantity: t.integer().default(0),
  ...timestamps,
});

export const purchasedProductTable = pgTable("purchased_products", {
  userId: t
    .integer("user_id")
    .notNull()
    .references(() => userTable.id),
  productId: t
    .integer("product_id")
    .notNull()
    .references(() => productTable.id),
  quantity: t.integer().notNull(),
  ...timestamps,
});
