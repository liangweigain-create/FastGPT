---
name: replace-proapi
description: Guidelines and workflows for replacing FastGPT Commercial/Pro API (`proApi`) endpoints with Open Source implementations. Activates when user wants to unlock "Pro" features, replace mocks, or implement local versions of commercial APIs. Keywords: proApi, Privatization Mock
---

# Replace ProAPI Best Practices

## When to Use This Skill
- User asks to "unlock" or "implement" a feature currently blocked by `proApi`.
- User mentions `[Privatization Mock]` in the prompt.
- User sees a "Feature depends on Commercial API" mock message.
- User wants to refactor `proApi` mocks into real open-source logic.
- User mentions `projects/app/src/pages/api/proApi/*`.

## Core Principles

1.  **Reuse Before Rewrite**: Many "Pro" features (like Team management) are already implemented in the OS version but diverted in the UI/API layer. Always check if a standard API exists.
2.  **Controller Pattern**: Do not write heavy logic in `pages/api`. Extract core logic to `packages/service/core/[module]/controller.ts`.
3.  **Strict Typing**: Always use shared types from `@fastgpt/global`.
4.  **Security First**: Never remove Auth. Use `NullPermissionVal` for public/logged-in access, or specific permission values for admin features.

## Workflows

### Scenario A: Feature Already Exists (e.g., Team List)
The ProAPI is just a different route for an existing OS feature.

1.  **Locate Standard API**: Check `projects/app/src/pages/api/` for the feature (e.g., `support/user/team/list.ts`).
2.  **Create Bridge Handler**: In `projects/app/src/pages/api/proApi/...`, import and re-export the standard handler.
    ```typescript
    // projects/app/src/pages/api/proApi/support/user/team/list.ts
    import handler from '../../api/support/user/team/list';
    export default handler;
    ```
3.  **Verify**: Ensure the frontend payload matches the standard API expectation.

### Scenario C: Clean Refactor (Recommended)
Update the frontend to point directly to the new standard API, removing the dependency on `proApi` entirely.

1.  **Backend**: Create the standard API endpoint (e.g. `projects/app/src/pages/api/support/user/team/list.ts`).
2.  **Frontend**: Update `projects/app/src/web/.../api.ts` to call the new endpoint (`/support/...` instead of `/proApi/...`).
3.  **Advantage**: Removes technical debt (mocks/bridges) immediately.


- [ ] **Auth**: Does the new API use `authApp` or `authCert`?
- [ ] **Rate Limiting**: Is `teamFrequencyLimit` applied?
- [ ] **Data Source**: Is the correct `source` enum used (e.g., `online`, `test`, `share`)?
- [ ] **Controller**: Is logic in `packages/service`?
- [ ] **Types**: Are `Props` and `Response` types imported from `@fastgpt/global`?

## Examples

### Example: Refactoring Chat Home

**Objective**: enabling Home Screen Chat (`chatHome`), which simulates `chatTest` but for end users.

**1. Create Controller (`packages/service/core/chat/controller.ts`)**
```typescript
export async function dispatchChatCompletion({ req, res, ... }) {
  // Auth
  const { teamId, tmbId } = await authApp({ ... });
  // Process...
  await dispatchWorkFlow({ ... });
}
```

**2. Implement Handler (`projects/app/src/pages/api/core/chat/chatHome.ts`)**
```typescript
import { dispatchChatCompletion } from '@fastgpt/service/core/chat/controller';

export default NextAPI(async (req, res) => {
  await dispatchChatCompletion({
     req, res, 
     permission: NullPermissionVal, // Open to all logged-in users
     source: ChatSourceEnum.online 
  });
});
```

**3. Cleanup ProApi Route** 
Optionally redirect or delete the mock file if the frontend is updated to point to the new route.
