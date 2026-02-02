---
name: permission-system-guide
description: Detailed guide on FastGPT's permission system, covering bitwise logic, DB schemas, collaborator syncing, and development standards. Activates when user asks about permissions, collaborators, auth logic, or adding new APIs.
---

# FastGPT Permission System Guide

> A comprehensive detailed guide for understanding and developing within FastGPT's permission system.

## When to Use This Skill

- User asks about **how permissions work** (e.g. "What is `0b001`?").
- User needs to **implement a new API** involving App or Dataset permissions.
- User is debugging **Collaborator** issues (e.g. "Why can't I see this app?").
- User mentions `MongoResourcePermission` or `authApp` / `authDataset`.
- User asks about **Team** structure and **Member** management.

---

## 1. Core Concepts (The "Brain")

FastGPT uses a **Bitwise Permission Model** stored in MongoDB.

### 1.1 Bitwise Logic
Permissions are stored as a single integer (Int32), not strings.
Location: `packages/global/support/permission/constant.ts`

| Role Name | Binary | Decimal | Note |
| :--- | :--- | :--- | :--- |
| **Manage** | `0b001` | `1` | Can edit settings, delete resource, manage members. |
| **Write** | `0b010` | `2` | Can edit content/knowledge. |
| **Read** | `0b100` | `4` | Can use/chat. |
| **Owner** | `~0` | `4294967295` | Full access (all bits set). |

**Implication**:
- `Manage` usually implies `Write` and `Read`.
- Code check: `permission & ReadPermissionVal > 0` (Check if has Read access).

### 1.2 Team Structure
- **Team**: The root tenant. All resources (`Apps`, `Datasets`) belong to a `Team`.
- **Team Member (tmb)**: A link between a `User` and a `Team`.
  - **CRITICAL**: Permissions are bound to `tmbId` (Team Member ID), **NOT** `userId`.
  - Never use `userId` in `MongoResourcePermission`.

---

## 2. Database Schema

### 2.1 Collection: `resource_permissions`
This table stores *all* collaborator permissions for Apps and Datasets.

| Field | Type | Description |
| :--- | :--- | :--- |
| `teamId` | ObjectId | The team this resource belongs to. |
| `resourceType` | String | `app` or `dataset`. |
| `resourceId` | ObjectId | The ID of the App or Dataset. |
| `tmbId` | ObjectId | The collaborator's Team Member ID. |
| `permission` | Number | The bitwise permission value (e.g. 7 for Manage+Write+Read). |

**Query Example**:
To find all collaborators for App `app-123`:
```javascript
MongoResourcePermission.find({
  resourceType: 'app',
  resourceId: 'app-123',
  teamId: currentTeamId
})
```

---

## 3. Business Logic: Syncing Collaborators

The "Update Collaborators" operation is a **Sync (Full Replacement)** logic, not a patch.

### The Flow (Backend)
When the frontend sends a list of collaborators:
1.  **Auth**: Check if the requester is the **Manager/Owner** of the resource (`authApp` / `authDataset`).
2.  **Fetch Existing**: Get all current records from `resource_permissions`.
3.  **Diff**: Compare "New List" vs "Old List".
    - **Remove**: IDs in "Old" but not in "New". -> `deleteOne`
    - **Update/Add**: IDs in "New". -> `updateOne({ upsert: true })`

**Code Reference**: `projects/app/src/pages/api/core/app/collaborator/update.ts`

---

## 4. Development Standards (Strict Rules)

### 4.1 Zod-First API Design
**Rule**: You MUST define Zod Schemas for all API inputs.
**Location**: `packages/global/openapi/core/{module}/collaborator.ts`

**Example**:
```typescript
export const GetAppCollaboratorListQuerySchema = z.object({
  appId: z.string().min(1)
});
```

### 4.2 API Implementation Location
**Location**: `projects/app/src/pages/api/core/{module}/collaborator/`
**Files**:
- `list.ts`: GET collaborators.
- `update.ts`: POST to sync collaborators.
- `delete.ts`: DELETE generic single collaborator.

### 4.3 Frontend Type Safety
**Rule**: Use `GET<ResponseType>` logic. Do NOT pass two generics to `GET`.
**Example**:
```typescript
import { CollaboratorListType } from '@fastgpt/global/support/permission/collaborator';

// Correct
GET<CollaboratorListType>('/url', { appId });
```

### 4.4 Privatization & ProApi
**Rule**: We removed `proApi` dependencies.
- **Do not import** `proApi` from anywhere.
- Use **local API routes** (e.g. `/core/app/collaborator/list`) instead.

---

## 5. Common Pitfalls & Debugging

- **Error: "Permission Denied"**:
  - Check if `tmbId` matches the current team context.
  - Check if the resource actually belongs to the `teamId`.
  - Check `authApp({ per: ManagePermissionVal })` logic.

- **Error: "Collaborator list empty"**:
  - Did you use `tmbId`? Or did you accidentally store `userId`?
  - Did you `upsert: true`?

- **Frontend TS Error on GET**:
  - You likely passed a second generic argument. Remove it. `GET<ResType>(...)`

---

## 6. Critical Files Map

- **Constants**: `packages/global/support/permission/constant.ts`
- **Schema**: `packages/service/support/permission/schema.ts`
- **Controller**: `packages/service/support/permission/controller.ts` (Shared logic like `getClbsInfo`)
- **API Logic**: `projects/app/src/pages/api/core/*/collaborator/*.ts`
- **UI Component**: `projects/app/src/components/support/permission/MemberManager/MemberModal.tsx`
