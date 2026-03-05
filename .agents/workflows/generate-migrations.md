---
description: Seamlessly generate Prisma migrations for Schema changes.
---

1. Ensure the PostgreSQL development database is running locally.
2. Formulate the specific change to `packages/prisma/src/schema.prisma`.
// turbo
3. Issue `pnpm run db:generate` to regenerate the types locally in case `packages/database` needs it.
// turbo
4. Issue `cd apps/api && pnpm dlx prisma migrate dev --name <enter_descriptive_name_here>` locally.
// turbo
5. Read `.agents/rules/common/git-workflow.md` to format the git commit with the corresponding migration file properly.
