# Plan: Monorepo TypeScript Centralization
**Status:** ACTIVE
**PRD Reference:** .agents/prd/core_prd.md
**Model Used:** Gemini 3 Pro
**Last Updated:** 2026-03-21

## Overview
Centralize the `typescript` dependency across the secure-vault-x monorepo. By removing it from all individual workspace `package.json` files and installing it exclusively at the repository root, we ensure a unified, predictable TypeScript version (e.g., ^5.3.3) is used globally. This plan also accounts for fixing any package import breakages that might surface during the process, and leverages the code-reviewer skill to guarantee stability.

## User Review Required
> [!IMPORTANT]
> This change impacts the build pipeline for all apps and packages. Please review the steps below. Once approved, I will proceed with the execution.

## Tasks
- [ ] [SEC] Verify no security risks in changing build dependencies (low risk).
- [ ] [DESIGN] Hoist typescript dependency to monorepo root.
- [ ] [IMPL] Remove `typescript` from all sub-packages (`apps/*` and `packages/*`).
- [ ] [IMPL] Ensure `typescript` is in the root `package.json` `devDependencies`.
- [ ] [IMPL] Run `pnpm install` in the root.
- [ ] [TEST] Build all packages by running `pnpm run build` and `pnpm run generate`.
- [ ] [IMPL] Correct any package import issues that arise during the build/generate phase.
- [ ] [REVIEW] Run the `code-reviewer.md` skill to scan the codebase and verify nothing is broken.

## Proposed Changes
---
### Root Configuration
#### [MODIFY] package.json (file:///Users/harrison/Downloads/secure-vault-x/package.json)
- Ensure `"typescript": "^5.3.3"` is installed under `devDependencies`.

---
### Workspaces (Apps & Packages)
#### [MODIFY] Multiple package.json files
Remove the `"typescript"` dependency/devDependency from:
- `apps/mobile/package.json`
- `apps/web/package.json`
- `packages/config/package.json`
- `packages/constants/package.json`
- `packages/crypto/package.json`
- `packages/libs/package.json`
- `packages/types/package.json`
- `packages/ui/package.json`
- `packages/ui-native/package.json`
- `packages/utils/package.json`
- `packages/validators/package.json`

## Verification Plan
### Automated Tests
- Run `pnpm install` to update the lockfile and node_modules.
- Run `pnpm run generate` to execute code generation steps.
- Run `pnpm run build` to compile the entire project. We will fix any type errors or import issues that occur.

### Security Post-Check
- We will execute the `code-reviewer.md` skill to analyze the changes before finalizing the task, ensuring alignment with project coding standards and zero-knowledge architecture principles.
