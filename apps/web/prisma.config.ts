import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "src/libs/db/prisma/schema.prisma",
  migrations: {
    path: "src/libs/db/prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
