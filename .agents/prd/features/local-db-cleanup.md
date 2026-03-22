---
trigger: local_db_cleanup
---

# Feature PRD: Local Database Cleanup Cron Job

## 1. Overview
As the user interacts with SecureVault X, the local database accumulates data over time. This includes items marked as deleted, cancelled notifications, or items explicitly marked as corrupted. To prevent the local database from growing indefinitely, a cron job service is required to periodically prune this data. Since SecureVault X syncs valid data to the server, hard deleting locally stale/invalid data does not result in total data loss assuming it was either meant to be deleted or synced.

## 2. Requirements

### 2.1 Trigger & Conditions
- The cleanup process must run **once every 3 days**.
- State tracking for the "last ran" timestamp must be managed using a **Zustand store**.

### 2.2 Data Targeting
The cron job will target and **hard delete** the following types of data from the local database:
- **Deleted Data**: Any valid secret or record marked for deletion.
- **Cancelled Notifications**: Any notification entity marked as cancelled.
- **Corrupted Data**: Any data explicitly marked as corrupted.
  - *Condition*: Corrupted data must be strictly **older than 3 days** (from the time it was marked corrupted) to be removed. Removing corrupted data immediately could affect debugging or recovery mechanisms.

### 2.3 Storage Constraint
- Hard-deleted data locally should not affect the server DB if the intention was for the local copy to just be cached. However, for fully deleted user data, it should have already synced the delete tombstone to the server.

## 3. Scope & Out of Scope
- **In Scope**: Creating the Zustand store, the cron job service, the database queries for clearing old data, and integration with the app lifecycle.
- **Out of Scope**: Server-side hard deletions (this is specific to local DB cache management).

## 4. Security & Privacy
- Deleting local data safely removes traces from the device, which increases security for compromised physical devices.
- Logging around this feature should **never** output the actual content being deleted (no secret data in logs), only counts and generic status messages.

## 5. Metrics
- Track the number of records cleared per run (for debugging purposes, log safely).
- Ensure the job completes without blocking the main thread.
