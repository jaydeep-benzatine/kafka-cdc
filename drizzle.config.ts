import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url: "postgres://postgres:root@localhost:5432/cdc",
  },
  migrations: {
    schema: "public",
  },
});
