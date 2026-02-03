# Refactor Chat API & Clean up Pro API Mocks

## Goals
1. **Reduce Code Duplication**: Extract common chat start logic from `chatHome` and `chatTest` into a shared controller in `packages/service`.
2. **Reuse Existing Logic**: For `proApi` endpoints that map to existing Open Source features (like `team/list`), reuse the existing handlers instead of creating mocks or duplicates.

## Proposed Changes

### 1. Shared Chat Controller
location: `packages/service/core/chat/controller.ts`
- Extract the core logic of `chatHome.ts` (which is largely `chatTest.ts`) into a new function `dispatchChatCompletion`.
- This function will handle:
  - Auth (accepting a permission level or computed auth result)
  - Frequency limits
  - User question parsing (plugin vs tool vs text)
  - History fetching and concatenation
  - Workflow dispatch
  - Saving chat records

### 2. Refactor Chat API Routes
- **`projects/app/src/pages/api/core/chat/chatHome.ts`**: Update to call `dispatchChatCompletion` with `NullPermissionVal` and `ChatSourceEnum.online`.
- **`projects/app/src/pages/api/core/chat/chatTest.ts`**: Update to call `dispatchChatCompletion` with `ReadPermissionVal` and `ChatSourceEnum.test`.

### 3. Cleanup ProAPI Mocks (Team List)
The user noted that `teamList` might be a duplicate.
- **`projects/app/src/pages/api/proApi/support/user/team/list.ts`** (Proposed New File): 
  - Create this file to explicitly handle the `proApi` route but simply import and re-export the handler from the standard `list.ts`.

## Verification Plan
1. **Compile**: Ensure TypeScript builds.
2. **Review**: Check that functionality (auth, stream, save) remains identical logic-wise.
