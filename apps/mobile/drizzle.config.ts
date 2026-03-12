import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/libs/database/schema.ts',
  out: './src/libs/database/drizzle/migrations',
  dialect: 'sqlite',
  driver: 'expo',
});
