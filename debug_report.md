# Debug & Implementation Report: Collaborators & Team Management

**Date**: 2026-01-31
**Subject**: Local Replacement of Commercial "Pro" APIs

## 1. Overview
We have successfully replaced the commercial API dependencies for **Team Management** and **Collaborator Permissions** with native local implementations. This ensures full functionality in the Open Source / Private Deployment version without relying on `proApi` endpoints.

## 2. API Implementation Details

### A. Collaborator Management
**Issue**: The frontend was calling `/proApi/system/model/collaborator/*` endpoints which expected a `model` parameter, whereas the local Open Source API (`/core/app/collaborator/*`) expects an `appId`.
**Status**: ✅ **Fixed**

*   **Modified File**: `projects/app/src/web/common/system/api.ts`
*   **Changes**:
    1.  **List**: Remapped `getModelCollaborators` to call `/core/app/collaborator/list` and passed `appId` instead of `model`.
    2.  **Update**: The frontend `updateModelCollaborators` supports batch updates (`models: string[]`), but the local API only supports single app updates. We implemented a `Promise.all` loop in the frontend wrapper to handle this compatibility layer.

### B. Team Permissions (Collaborators)
**Issue**: The "Permissions" tab in Team Management relied on `proApi` endpoints to list and manage team member permissions.
**Status**: ✅ **Implemented**

*   **New APIs**:
    *   `projects/app/src/pages/api/support/user/team/collaborator/list.ts`: Lists members, groups, and orgs with their permissions.
    *   `projects/app/src/pages/api/support/user/team/collaborator/update.ts`: Batch update permissions.
    *   `projects/app/src/pages/api/support/user/team/collaborator/updateOne.ts`: Single update permission.
    *   `projects/app/src/pages/api/support/user/team/collaborator/delete.ts`: Remove permission.
*   **Fix**: Resolved DOM nesting warnings in `PermissionManage/index.tsx` by correct table cell wrapping.

### C. Team Creation & Invitations
**Issue**: Creating teams and inviting members were restricted to `proApi`.
**Status**: ✅ **Implemented**

*   **New Schema**: Created `MongoInvitationLink` in `packages/service/support/user/team/invitationLink/schema.ts` to support local storage of invitation links.
*   **New APIs**:
    *   `projects/app/src/pages/api/support/user/team/create.ts`: Create a new team.
    *   `projects/app/src/pages/api/support/user/team/invitationLink/create.ts`: Create invitation link.
    *   `projects/app/src/pages/api/support/user/team/invitationLink/list.ts`: List invitation links.
    *   `projects/app/src/pages/api/support/user/team/invitationLink/delete.ts`: Delete invitation link.
    *   `projects/app/src/pages/api/support/user/team/invitationLink/info.ts`: Get invitation info (public).
    *   `projects/app/src/pages/api/support/user/team/invitationLink/accept.ts`: Accept invitation.
    *   `projects/app/src/pages/api/support/user/team/invitationLink/forbid.ts`: Forbid invitation.

*   **Updated Constants**: Added `admin` and `member` roles to `TeamMemberRoleEnum` in `packages/global/support/user/team/constant.ts` to support full role management.

### D. Team Member Export
**Issue**: The "Export Members" button in the Team Management UI was hardcoded to `/api/proApi/support/user/team/member/export`.
**Status**: ✅ **Implemented & Fixed**

*   **New API**: Created `projects/app/src/pages/api/support/user/team/member/export.ts`.
*   **Frontend Update**: Modified `projects/app/src/pageComponents/account/team/MemberTable.tsx` to point to the new local API.

### E. Team List & Switch
**Status**: ✅ **Verified**
*   These features were previously patched and are correctly using local APIs:
    *   `/api/support/user/team/list` (List my teams)
    *   `/api/support/user/team/switch` (Switch context)

## 3. Generic Mock Strategy
To prevent system crashes for other implemented features, we added a catch-all Mock for any remaining `proApi` calls.

*   **File**: `projects/app/src/pages/api/proApi/[...path].ts`
*   **Behavior**:
    *   Logs the request to the server console: `[Privatization Mock] triggered: ...`
    *   Returns `200 OK` with a "Not Implemented" message to keep the UI stable.

## 4. UI/UX Unlocking (feConfigs)
We have removed artificial UI restrictions by forcing feature flags to `true` in the system configuration loader.

*   **Modified File**: `projects/app/src/service/common/system/index.ts`
*   **Unlocked Features**:
    *   **Global Plus Mode**: `isPlus: true` (Unlocks Teams, Tags, Charts, Pro Inputs).
    *   **Dataset Enhancement**: `show_dataset_enhance: true` (Unlocks advanced dataset processing options).
    *   **Batch Evaluation**: `show_batch_eval: true`.

## 5. Modified Files List

| File Path | Change Description |
| :--- | :--- |
| `projects/app/src/web/common/system/api.ts` | Redirected collaborator APIs to local endpoints. |
| `projects/app/src/web/support/user/team/api.ts` | Redirected Team Management and Invitation APIs to local endpoints. |
| `packages/global/support/user/team/constant.ts` | Added `admin`/`member` roles. |
| `projects/app/src/pageComponents/account/team/MemberTable.tsx` | Updated export URL to local API. |
| `projects/app/src/pageComponents/account/team/PermissionManage/index.tsx` | Fixed DOM nesting warning. |
| `projects/app/src/pages/api/support/user/team/collaborator/*` | **[NEW]** Local Collaborator APIs. |
| `projects/app/src/pages/api/support/user/team/create.ts` | **[NEW]** Local Team Create API. |
| `projects/app/src/pages/api/support/user/team/invitationLink/*` | **[NEW]** Local Invitation APIs. |
| `packages/service/support/user/team/invitationLink/schema.ts` | **[NEW]** Invitation Link Schema. |
| `projects/app/src/pages/api/support/user/team/member/export.ts` | **[NEW]** Local export API. |
| `projects/app/src/pages/api/proApi/[...path].ts` | **[NEW]** Generic mock handler. |
| `projects/app/src/service/common/system/index.ts` | Force enabled features. |

## 6. Known Issues / Generic Mocks
The following features are currently handled by the Generic Mock (will return success but do nothing/show empty data):
*   **App Logs Charts**: `/proApi/core/app/logs/getChartData`
*   **Billing/Usage**: All `/proApi/support/wallet/*` endpoints.
