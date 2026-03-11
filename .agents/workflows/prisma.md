---
description: Prisma
---

# Turborepo (/docs/guides/deployment/turborepo)



Prisma is a powerful ORM for managing databases, and [Turborepo](https://turborepo.dev/docs) simplifies monorepo workflows. By combining these tools, you can create a scalable, modular architecture for your projects.

This guide will show you how to set up Prisma as a standalone package in a Turborepo monorepo, enabling efficient configuration, type sharing, and database management across multiple apps.

What you'll learn: [#what-youll-learn]

* How to set up Prisma in a Turborepo monorepo.
* Steps to generate and reuse PrismaClient across packages.
* Integrating the Prisma package into other applications in the monorepo.

Prerequisites [#prerequisites]

* [Node.js 20.19.0+](https://nodejs.org/)
* [TypeScript 5.4.0+](https://www.typescriptlang.org/)

1. Set up your project [#1-set-up-your-project]

To set up a Turborepo monorepo named `turborepo-prisma`, run the following command:

<CodeBlockTabs defaultValue="npm" groupId="package-manager" persist>
  <CodeBlockTabsList>
    <CodeBlockTabsTrigger value="npm">
      npm
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="pnpm">
      pnpm
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="yarn">
      yarn
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="bun">
      bun
    </CodeBlockTabsTrigger>
  </CodeBlockTabsList>

  <CodeBlockTab value="npm">
    ```bash
    npx create-turbo@latest turborepo-prisma
    ```
  </CodeBlockTab>

  <CodeBlockTab value="pnpm">
    ```bash
    pnpm dlx create-turbo@latest turborepo-prisma
    ```
  </CodeBlockTab>

  <CodeBlockTab value="yarn">
    ```bash
    yarn dlx create-turbo@latest turborepo-prisma
    ```
  </CodeBlockTab>

  <CodeBlockTab value="bun">
    ```bash
    bunx --bun create-turbo@latest turborepo-prisma
    ```
  </CodeBlockTab>
</CodeBlockTabs>

You'll be prompted to select your package manager, this guide will use `npm`:

<CalloutContainer type="info">
  <CalloutDescription>
    * *Which package manager do you want to use?* `npm`
  </CalloutDescription>
</CalloutContainer>

After the setup, navigate to the project root directory:

```bash
cd turborepo-prisma
```

2. Add a new database package to the monorepo [#2-add-a-new-database-package-to-the-monorepo]

2.1 Create the package and install Prisma [#21-create-the-package-and-install-prisma]

Create a `database` directory inside `packages` and navigate into it:

```bash
mkdir -p packages/database
cd packages/database
```

Then initialize it with a `package.json`:

```json title="packages/database/package.json"
{
  "name": "@repo/db",
  "version": "0.0.0"
}
```

Then install the required Prisma ORM dependencies:

<CodeBlockTabs defaultValue="npm" groupId="package-manager" persist>
  <CodeBlockTabsList>
    <CodeBlockTabsTrigger value="npm">
      npm
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="pnpm">
      pnpm
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="yarn">
      yarn
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="bun">
      bun
    </CodeBlockTabsTrigger>
  </CodeBlockTabsList>

  <CodeBlockTab value="npm">
    ```bash
    npm install prisma --save-dev
    npm install @prisma/client @prisma/adapter-pg pg dotenv
    ```
  </CodeBlockTab>

  <CodeBlockTab value="pnpm">
    ```bash
    pnpm add prisma --save-dev
    pnpm add @prisma/client @prisma/adapter-pg pg dotenv
    ```
  </CodeBlockTab>

  <CodeBlockTab value="yarn">
    ```bash
    yarn add prisma --dev
    yarn add @prisma/client @prisma/adapter-pg pg dotenv
    ```
  </CodeBlockTab>

  <CodeBlockTab value="bun">
    ```bash
    bun add prisma --dev
    bun add @prisma/client @prisma/adapter-pg pg dotenv
    ```
  </CodeBlockTab>
</CodeBlockTabs>

<CalloutContainer type="info">
  <CalloutDescription>
    If you are using a different database provider (MySQL, SQL Server, SQLite), install the corresponding driver adapter package instead of `@prisma/adapter-pg`. For more information, see [Database drivers](/orm/core-concepts/supported-databases/database-drivers).
  </CalloutDescription>
</CalloutContainer>

2.2. Initialize Prisma and define models [#22-initialize-prisma-and-define-models]

Inside the `database` directory, initialize Prisma by running:

<CodeBlockTabs defaultValue="npm" groupId="package-manager" persist>
  <CodeBlockTabsList>
    <CodeBlockTabsTrigger value="npm">
      npm
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="pnpm">
      pnpm
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="yarn">
      yarn
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="bun">
      bun
    </CodeBlockTabsTrigger>
  </CodeBlockTabsList>

  <CodeBlockTab value="npm">
    ```bash
    npx prisma init --db
    ```
  </CodeBlockTab>

  <CodeBlockTab value="pnpm">
    ```bash
    pnpm dlx prisma init --db
    ```
  </CodeBlockTab>

  <CodeBlockTab value="yarn">
    ```bash
    yarn dlx prisma init --db
    ```
  </CodeBlockTab>

  <CodeBlockTab value="bun">
    ```bash
    bunx --bun prisma init --db
    ```
  </CodeBlockTab>
</CodeBlockTabs>

You'll be prompted to authenticate in Prisma Console, choose a project name, and pick a region for your Prisma Postgres database.

This will create several files inside `packages/database`:

* A `prisma` directory with a `schema.prisma` file.
* A `prisma.config.ts` file for configuring Prisma.
* A Prisma Postgres database.
* A `.env` file containing the `DATABASE_URL` in the `packages/database` directory.

In the `packages/database/prisma/schema.prisma` file, add the following models:

```prisma title="packages/database/prisma/schema.prisma"
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
}

model User { // [!code ++]
  id    Int     @id @default(autoincrement()) // [!code ++]
  email String  @unique // [!code ++]
  name  String? // [!code ++]
  posts Post[] // [!code ++]
} // [!code ++]
 // [!code ++]
model Post { // [!code ++]
  id        Int     @id @default(autoincrement()) // [!code ++]
  title     String // [!code ++]
  content   String? // [!code ++]
  published Boolean @default(false) // [!code ++]
  authorId  Int // [!code ++]
  author    User    @relation(fields: [authorId], references: [id]) // [!code ++]
} // [!code ++]
```

The `prisma.config.ts` file created in the `packages/database` directory should look like this:

```typescript title="packages/database/prisma.config.ts"
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

<CalloutContainer type="warning">
  <CalloutDescription>
    It is recommended to add `packages/database/generated` to your root `.gitignore` because generated Prisma Client code is a build artifact that can be recreated with `db:generate`.
  </CalloutDescription>
</CalloutContainer>

The importance of generating Prisma types in a custom directory [#the-importance-of-generating-prisma-types-in-a-custom-directory]

In the `schema.prisma` file, we specify a custom [`output`](/orm/reference/prisma-schema-reference#fields-for-prisma-client-provider) path where Prisma will generate its types. This ensures Prisma's types are resolved correctly across different package managers.

<CalloutContainer type="info">
  <CalloutDescription>
    In this guide, the types will be generated in the `database/generated/prisma` directory.
  </CalloutDescription>
</CalloutContainer>

2.3. Add scripts and run migrations [#23-add-scripts-and-run-migrations]

Let's add some scripts to the `package.json` inside `packages/database`:

```json title="packages/database/package.json"
{
  "name": "@repo/db",
  "version": "0.0.0",
  "type": "module", // [!code ++]
  "scripts": {
    // [!code ++]
    "db:generate": "prisma generate", // [!code ++]
    "db:migrate": "prisma migrate dev", // [!code ++]
    "db:deploy": "prisma migrate deploy" // [!code ++]
  }, // [!code ++]
  "devDependencies": {
    "prisma": "^7.0.0"
  },
  "dependencies": {
    "@prisma/client": "^7.0.0",
    "@prisma/adapter-pg": "^7.0.0",
    "pg": "^8.0.0",
    "dotenv": "^16.0.0"
  }
}
```

Let's also add these scripts to `turbo.json` in the root and ensure that `DATABASE_URL` is added to the environment:

```json title="turbo.json"
{
  "$schema": "https://turborepo.dev/schema.json",
  "ui": "tui",
  "globalEnv": ["DATABASE_URL"], // [!code ++]
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": [".next/**", "!.next/cache/**"]
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "check-types": {
      "dependsOn": ["^check-types"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "db:generate": { // [!code ++]
      "cache": false // [!code ++]
    }, // [!code ++]
    "db:migrate": { // [!code ++]
      "cache": false // [!code ++]
    }, // [!code ++]
    "db:deploy": { // [!code ++]
      "cache": false // [!code ++]
    } // [!code ++]
  }
}
```

Run your first migration and generate Prisma Client

Navigate to the project root and run the following command to create and apply your first migration:

<CodeBlockTabs defaultValue="npm" groupId="package-manager" persist>
  <CodeBlockTabsList>
    <CodeBlockTabsTrigger value="npm">
      npm
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="pnpm">
      pnpm
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="yarn">
      yarn
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="bun">
      bun
    </CodeBlockTabsTrigger>
  </CodeBlockTabsList>

  <CodeBlockTab value="npm">
    ```bash
    npx turbo run db:migrate -- --name init
    ```
  </CodeBlockTab>

  <CodeBlockTab value="pnpm">
    ```bash
    pnpm dlx turbo run db:migrate -- --name init
    ```
  </CodeBlockTab>

  <CodeBlockTab value="yarn">
    ```bash
    yarn dlx turbo run db:migrate -- --name init
    ```
  </CodeBlockTab>

  <CodeBlockTab value="bun">
    ```bash
    bunx --bun turbo run db:migrate -- --name init
    ```
  </CodeBlockTab>
</CodeBlockTabs>

In Prisma 7, `migrate dev` no longer runs `prisma generate` automatically, so run generate explicitly:

<CodeBlockTabs defaultValue="npm" groupId="package-manager" persist>
  <CodeBlockTabsList>
    <CodeBlockTabsTrigger value="npm">
      npm
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="pnpm">
      pnpm
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="yarn">
      yarn
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="bun">
      bun
    </CodeBlockTabsTrigger>
  </CodeBlockTabsList>

  <CodeBlockTab value="npm">
    ```bash
    npx turbo run db:generate
    ```
  </CodeBlockTab>

  <CodeBlockTab value="pnpm">
    ```bash
    pnpm dlx turbo run db:generate
    ```
  </CodeBlockTab>

  <CodeBlockTab value="yarn">
    ```bash
    yarn dlx turbo run db:generate
    ```
  </CodeBlockTab>

  <CodeBlockTab value="bun">
    ```bash
    bunx --bun turbo run db:generate
    ```
  </CodeBlockTab>
</CodeBlockTabs>

Use the same `npx turbo run db:generate` command after future schema changes.

2.4. Export the Prisma client and types [#24-export-the-prisma-client-and-types]

Next, export the generated types and an instance of `PrismaClient` so it can be used in your applications.

In the `packages/database` directory, create a `src` folder and add a `client.ts` file. This file will define an instance of `PrismaClient`:

```ts title="packages/database/src/client.ts"
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new