import { drizzle } from "drizzle-orm/postgres-js";

export const db = drizzle(process.env.DATABASE_URL!);

export async function dbHealthCheck() {
  try {
    await db.execute("SELECT 1=1");
    console.log("✅ DB connected successful");
    return true;
  } catch (error) {
    console.error(
      "❌ Unable to connect to db. Please check the connection",
      (error as Error)?.message ?? error,
    );
    return false;
  }
}
