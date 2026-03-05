---
description: Deploy Mobile API changes safely to the staging environment.
---

1. Run `pnpm run lint` safely to ensure no missing syntax.
2. Run `pnpm run build` on `apps/api` to verify TypeScript builds successfully.
3. Apply any Prisma database changes via `pnpm dlx prisma migrate deploy`.
4. Deploy the Edge application via `pnpm run deploy:staging`.
5. Post-deploy, run a smoke test manually to hit the base staging URL.
