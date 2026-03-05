import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
 test: {
  setupFiles: ['./tests/setup.ts']
 },
 resolve: {
  alias: {
   '@securevault/constants': path.resolve(__dirname, '../../packages/constants/src/index.ts'),
   '@securevault/database': path.resolve(__dirname, '../../packages/prisma/src/index.ts'),
   '@securevault/validators': path.resolve(__dirname, '../../packages/validators/src/index.ts'),
   '@securevault/types': path.resolve(__dirname, '../../packages/types/src/index.ts'),
   '@securevault/crypto': path.resolve(__dirname, '../../packages/crypto/src/index.ts'),
   '@securevault/utils': path.resolve(__dirname, '../../packages/utils/src/index.ts'),
   '@securevault/config': path.resolve(__dirname, '../../packages/config/src/index.ts')
  }
 }
});
