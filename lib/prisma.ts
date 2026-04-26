import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url && process.env.NODE_ENV === "production") {
  throw new Error("DATABASE_URL or TURSO_DATABASE_URL is not set in production");
}

const libsql = createClient({
  url: url ?? "file:./dev.db",
  authToken,
});

export const prisma =
  global.prisma ??
  new PrismaClient({
    adapter: new PrismaLibSql(libsql),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;

