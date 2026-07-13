import { PrismaClient } from '@prisma/client';

// Prisma client singleton — survives Next.js dev HMR without exhausting
// SQLite file handles / Postgres connections.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
