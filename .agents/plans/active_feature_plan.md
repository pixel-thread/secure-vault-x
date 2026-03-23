# Plan: Local DB Cleanup Cron Job
**Status:** ACTIVE
**PRD Reference:** .agents/prd/features/local-db-cleanup.md
**Model Used:** Gemini 3 Pro
**Last Updated:** 2026-03-22

## Tasks
- [x] [SEC] Identify and model all security-sensitive surfaces (Data scope, deletion logging).
- [ ] [DESIGN] Schema design for `corruptedAt` fields and DB cleanup service.
- [ ] [TEST] Write unit tests for checking the 3-day deletion logic.
- [ ] [IMPL] Implement Zustand store for `lastCleanupRanAt`.
- [ ] [IMPL] Implement cron job / background sync logic to prune old data.
- [ ] [REVIEW] Security review gate before merging.

## Security Flags
> A09 Security Logging: Ensure deleted raw content is not logged during cleanup.
> Data Retention: By hard-deleting locally, we assume server sync completed successfully for valid data.
