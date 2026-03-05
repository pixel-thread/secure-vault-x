# PRD: Local-First Sync with Expo SQLite + Drizzle

## Overview

Implement a **local-first data layer** using **Expo SQLite** with **Drizzle ORM** that allows the app to function offline and automatically sync with the backend when connectivity is available.

Synchronization is based on **`updated_at` timestamps**. The system will only update records when a newer timestamp exists.

The system also supports **automatic database migrations**, ensuring that any new migration files are executed locally if they have not yet been applied.

---

# Goals

- Enable **offline-first application behavior**
- Maintain **data consistency between local SQLite and server database**
- Ensure **minimal sync operations** by comparing timestamps
- Support **bidirectional sync (local → server, server → local)**
- Automatically **run pending migrations on app startup**

---

# Non-Goals

- Real-time collaborative editing
- Complex merge strategies beyond timestamp resolution
- Multi-device CRDT or operational transforms

---

# Architecture

## Local Database

- Database: **Expo SQLite**
- ORM: **Drizzle ORM**
- Storage: device-local SQLite database
- Schema mirrors server schema.

---

# Database Migration System

## Overview

The app must **automatically detect and run pending migrations** when it starts.

This ensures the local database schema is always compatible with the current application version.

---

## Migration Storage

Migrations are stored in the application bundle.

Example structure:

```
/libs/db
        /migrations
            0001_init.sql
            0002_add_notes_table.sql
            0003_add_deleted_at.sql
```

---

## Migration Tracking Table

Create a table to track applied migrations.

```ts
migrations;
```

Schema:

```
id: text primary key
executed_at: integer
```

Example record:

```
0001_init
0002_add_notes_table
```

---

## Migration Execution Flow

On app startup:

```
1. Initialize SQLite connection
2. Read migration files from /db/migrations
3. Check migrations table
4. Identify migrations not yet executed
5. Run missing migrations in order
6. Record each migration after success
```

Pseudocode:

```
for migration in sorted(migration_files):
    if migration.id not in migrations_table:
        run migration.sql
        insert into migrations (id, executed_at)
```

---

## Startup Flow

Full application startup sequence:

```
App Start
   ↓
Open SQLite DB
   ↓
Run pending migrations
   ↓
Initialize Drizzle ORM
   ↓
Load sync metadata
   ↓
Run initial sync
```

---

# Required Fields for Sync Tables

Every syncable table must include:

```
id: string
created_at: number
updated_at: number
deleted_at?: number | null
```

---

# Field Definitions

| Field        | Description               |
| ------------ | ------------------------- |
| `id`         | Unique identifier (UUID)  |
| `created_at` | Record creation timestamp |
| `updated_at` | Last update timestamp     |
| `deleted_at` | Soft delete timestamp     |

---

# Sync Strategy

Sync is **timestamp-based**.

---

# Server → Local

Fetch records updated after the last sync.

```
GET /sync?since=<last_synced_at>
```

For each record:

```
if server.updated_at > local.updated_at:
    update local record
else:
    ignore
```

Steps:

1. Read `last_synced_at`
2. Request updates from server
3. Compare timestamps
4. Apply updates locally

---

# Local → Server

Push records modified locally.

```
POST /sync/push
```

Payload example:

```json
{
  "changes": [
    {
      "id": "uuid",
      "updated_at": 1710000000,
      "data": {}
    }
  ]
}
```

Server logic:

```
if local.updated_at > server.updated_at:
    update server
else:
    ignore
```

---

# Conflict Resolution

Strategy: **Last Write Wins (LWW)**

Rule:

```
newer updated_at wins
```

Example:

| Local | Server | Result      |
| ----- | ------ | ----------- |
| 100   | 200    | server wins |
| 300   | 200    | local wins  |

---

# Sync Triggers

Sync should run when:

1. App launch
2. App foreground
3. Network reconnect
4. Manual refresh
5. Periodic background sync (optional)

---

# Sync State Tracking

Local metadata table:

```
sync_meta
```

Schema:

```
key: string
value: string
```

Example:

```
last_synced_at = 1710000000
```

---

# Example Table

```
notes
```

Schema example:

```
id: text primary key
title: text
content: text
created_at: integer
updated_at: integer
deleted_at: integer
```

---

# Example Sync Flow

### Create Record Offline

```
local.updated_at = now()
insert into sqlite
```

### Sync Up

```
push record to server
server compares timestamps
server updates record
```

### Sync Down

```
server returns newer records
client updates SQLite
```

---

# Edge Cases

### Device Offline

- Writes always succeed locally
- Sync queued until network available

### Simultaneous Updates

- Timestamp resolution applies

### Deleted Records

Use **soft delete**

```
deleted_at != null
```

---

# Performance Considerations

- Sync only **changed records**
- Batch requests
- Use **indexed `updated_at` fields**
- Limit sync payload size

---

# Observability

Log:

- sync start
- records pushed
- records pulled
- conflicts resolved
- migrations executed

---

# Future Improvements

- Per-table sync cursors
- WebSocket live sync
- Partial field merge
- CRDT support
- Background sync workers
- Server-driven migrations

---

# Acceptance Criteria

- App works fully offline
- Local changes sync when network returns
- No duplicate records
- Timestamp conflict resolution works
- Pending migrations run automatically
- Database always matches latest schema
- Sync completes under **2 seconds for 500 records**

---

# Tech Stack

| Layer               | Technology          |
| ------------------- | ------------------- |
| Local DB            | Expo SQLite         |
| ORM                 | Drizzle ORM         |
| Migrations          | SQL migration files |
| Sync API            | REST                |
| Conflict Resolution | Timestamp (LWW)     |
