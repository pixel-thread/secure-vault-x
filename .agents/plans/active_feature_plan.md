# Implementation Plan: Vault Pagination & FlashList Integration

## Overview
Implement pagination for the mobile app's vault list to ensure high performance and responsiveness, especially as the number of vault items scales. The plan includes switching data fetching to `useInfiniteQuery`, updating the local SQLite backend query with `LIMIT` and `OFFSET`, and replacing React Native's standard `FlatList` with Shopify's highly performant `FlashList`.

## Requirements
- Paginate the data fetched from the local DB.
- Auto-fetch the next page on scroll in `VaultScreen()`.
- Ensure secure implementation following `rules/common/security.md`.
- Optimize for speed by bringing in `@shopify/flash-list` (currently not installed).
- Prevent decryption bottlenecks by decrypting only a page of items at a time rather than the entire vault.

## Architecture Changes
- **Dependency**: Add `@shopify/flash-list` for highly performant list rendering.
- **Service Layer**: Modify `VaultService.getVaultItems()` to accept pagination parameters (`limit`, `offset`) and apply them to the Drizzle SQLite query.
- **Context Layer**: Update `VaultProvider`'s data fetching in `useQuery` to `@tanstack/react-query`'s `useInfiniteQuery` to handle fetching and concatenating pages of data.
- **UI Layer**: Refactor `<FlatList />` in `VaultScreen/index.tsx` to `<FlashList />` with `onEndReached` pointing to the fetch-next-page function.

## Implementation Steps

### Phase 1: Preparation & Dependencies
1. **Install FlashList** (Terminal)
   - Action: Run `npm install @shopify/flash-list` and `npx expo prebuild` or relevant installation script depending on environment.
   - Why: FlashList is essential for rendering large encrypted datasets (like a password manager vault) at 60 FPS without memory bloat.
   - Dependencies: None
   - Risk: Low (Mainly native linking, standard for Expo)

### Phase 2: Service Layer (1 file)
2. **Paginate DB Query & Decryption** (File: `apps/mobile/src/services/VaultService.ts`)
   - Action: Update `getVaultItems({ limit: number; offset: number })`. Apply `.limit(limit).offset(offset)` to the Drizzle query. 
   - Why: Decrypting 1,000s of AES-256-GCM items at once blocks the JS thread (performance requirement: < 300ms for 1000 items, but paginating guarantees < 50ms). We will only decrypt the current page's payload.
   - Dependencies: None
   - Risk: Medium (ensure no data loss or corruption warnings are incorrectly triggered)

### Phase 3: Context & Provider (2 files)
3. **Update Vault Types** (File: `apps/mobile/src/types/vault.ts` or `apps/mobile/src/libs/context/VaultContext.ts`)
   - Action: Add `fetchNextPage`, `hasNextPage`, and `isFetchingNextPage` to `VaultContextT`.
   - Why: Components need these to trigger and display infinite scroll status.
   - Dependencies: Step 2

4. **Refactor to Infinite Query** (File: `apps/mobile/src/components/providers/vault/index.tsx`)
   - Action: Replace `useQuery` with `useInfiniteQuery` for `['vault', user?.id]`. Set `getNextPageParam` to return the next offset based on the length of the returned array vs the `limit` (e.g., 20 items per page). Update `value` provider object.
   - Why: React Query handles infinite scrolling state seamlessly.
   - Dependencies: Step 2, Step 3
   - Risk: Low

### Phase 4: UI & Performance (1 file)
5. **Implement FlashList** (File: `apps/mobile/src/components/screens/vault/index.tsx`)
   - Action: Replace `FlatList` with `FlashList` from `@shopify/flash-list`.
   - Action: Wire `onEndReached={fetchNextPage}` and `onEndReachedThreshold={0.5}`. Set an appropriate `estimatedItemSize` (e.g., 80) for the `VaultItem`.
   - Why: Massive performance boost and memory efficiency over FlatList.
   - Dependencies: Phase 1 & 3
   - Risk: Low

## Testing Strategy
- Unit tests: Not directly required for UI layout, but make sure SQLite queries return expected subset lengths.
- Manual Verification:
  1. Login to the mobile app.
  2. Use the "flask" button in `VaultScreen` (in development mode) to seed 100+ items.
  3. Verify that only the first 20 (or chosen limit) items render initially.
  4. Scroll to the bottom and verify the next batch is fetched and rendered seamlessly.
  5. Check console for any re-render or layout warnings from FlashList.

## Risks & Mitigations
- **Risk**: Deleting an item shifts the offsets, potentially causing duplicates on the next page fetch or missing an item.
  - Mitigation: Since the list updates locally (via cache invalidation), React Query's `invalidateQueries` will re-fetch the first page (or all fetched pages sequentially), ensuring consistency.

## Success Criteria
- [ ] `@shopify/flash-list` is installed and used.
- [ ] Initial DB load and decryption fetches a limited dataset (e.g., 20 items).
- [ ] Scrolling the vault list automatically queries and decrypts the next chunk.
- [ ] No regression in single-item UI performance or visual bugs compared to FlatList.
