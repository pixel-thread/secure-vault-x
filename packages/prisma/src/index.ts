import { PrismaClient } from "@prisma/client";

export { Prisma } from "./generated/prisma";

export const prisma = new PrismaClient();
