
# FastGPT Secondary Development Review

## 1. Summary of Changes

To enable full functionality in the Open Source version without Commercial (Pro) dependencies, we made the following core modifications:

### A. Initialization (Unified Team)
- **Problem**: Users were isolated in their own teams, unable to share apps/knowledge bases.
- **Fix**: Modified `projects/app/src/service/mongo.ts` (`initSystemUsers`) to force all system users (`user1`, `user2`...) into the `root` user's team.
- **Mechanism**:
  1. Boot `root` user first.
  2. Boot `system users`, check if they are in `root` team.
  3. If not, add them with `owner` role.

### B. Team Member List (Local API)
- **Problem**: Clicking "Team Members" called `/proApi/...` which failed.
- **Fix**:
  1. Implemented `projects/app/src/pages/api/support/user/team/member/list.ts`.
  2. Updated frontend `projects/app/src/web/support/user/team/api.ts` to use this local endpoint.

### C. Permission Management (Local API)
- **Problem**: "Manage Collaborators" called `/proApi` for list/update/delete.
- **Fix**:
  1. Implemented local APIs in `projects/app/src/pages/api/core/app/collaborator/`.
  2. Mocked `Group` and `Org` list APIs to returning empty lists `[]` to prevent UI crashes in the "Manage" popup.
  3. Corrected schema mismatch: Backend `MongoResourcePermission` uses `permission` field (Standard), but some old logic/types might have used `val`. We unified on `permission`.

---

## 2. Root Cause Analysis

### Why did "Pro API" errors occur?
FastGPT is designed with a "Core" (Open Source) and "Pro" (Commercial) architecture.
- **Core**: Basic Chat, RAG, Flow.
- **Pro**: Team management, precise permissions, billing, diverse login methods.
The frontend code is shared. When you click "Team" or "Collaborator", it defaults to checking if `Pro` is configured. If not, it crashes or shows "Not Configured". We bypassed this by providing local implementations of those specific Pro interfaces.

### Why did persistence fail initially?
- **Schema Mismatch**: The database schema `MongoResourcePermission` defines the value field as `permission` (Number). Our initial code attempted to read/write `val`, so data wasn't saving to the correct column, causing reads to return `undefined` (or default 0).

---

## 3. Bug Hunting Guide

### Bug 1: Collaborator List shows 0
**Observed**: Frontend shows empty list after save.
**Root Cause Hypothesis**:
1. **Frontend Parsing**: The local API returns a JSON representation of the `AppPermission` class, but the frontend might expect a different structure or re-instantiation.
2. **ID Mismatch**: `tmbId` in `MongoResourcePermission` vs `MongoTeamMember` ID.
**Debug Action**: I have added logs to `list.ts`. Check server logs when opening the modal. If `API List Response` contains data but frontend is empty, it's a frontend parsing mismatch.

### Bug 2: Users cannot Create Agents
**Observed**: `user1` (Owner) cannot create apps.
**Root Cause Hypothesis**:
1. **Team Limits**: The "Root Team" might have a default limit of 0 or 1 apps (Standard Plan limits). Check `MongoTeam` collection `limit` field.
2. **Context**: Ensure `user1` is logged into the "Root Team" and not their own personal team (check top-left team switcher).
3. **Permissions**: Although `owner` theoretically has all permissions, the explicit `createApp` bit might be missing from the `owner` definition in the Open Source logic (since `TeamRoleList` separated it).
**Fix**:
- You can manually check `TeamRoleList` in `packages/global/support/permission/user/constant.ts`.
- Ensure `owner` covers `appCreate` bit (`0b001000`).

## 4. How to View/Modify Roles
Roles are defined in `packages/global/support/permission/user/constant.ts`.
- **Permissions**: Defined as binary bits (e.g., `appCreate: 0b001000`).
- **Roles**: Combinations of permissions.
To give `Standard` members ability to create apps, you would modify `TeamRoleList` to include the `appCreate` bit in the standard member role value.
