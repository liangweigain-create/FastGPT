# Refactoring Chat API Handlers: Shared Controller Design

## Problem
Currently, `chatHome.ts` and `chatTest.ts` share >95% of their logic. This leads to maintenance issues where fixes applied to one might be missed in the other. Additionally, the `proApi` mocks contain redundant logic for features that already exist in the OS version.

## Solution

### 1. Unified Controller (`dispatchChatCompletion`)
We will extract the orchestration logic into `packages/service/core/chat/controller.ts`.

#### Interface
```typescript
interface DispatchChatProps {
  req: NextApiRequest;
  res: NextApiResponse;
  body: Props;
  permission: PermissionValueType;
  chatSource: ChatSourceEnum;
}
```

#### Core Logic Flow
1. **Auth**: Validate user permissions based on the input `permission` level.
2. **Rate Limit**: Check `teamFrequencyLimit`.
3. **Parsing**: Convert inputs (messages/nodes) into standard `UserChatItemType`.
4. **History**: Fetch and append history.
5. **Runtime**: Convert inputs to `RuntimeNodes`.
6. **Dispatch**: Call `dispatchWorkFlow`.
7. **Response**: Stream SSE response.
8. **Storage**: Save chat record (`saveChat` or `updateInteractiveChat`).

### 2. Standardizing API Handlers
The API handlers will become thin wrappers around this controller.

**Example `chatHome.ts`:**
```typescript
export default NextAPI(async (req, res) => {
  await dispatchChatCompletion({
    req, res,
    body: req.body,
    permission: NullPermissionVal,
    chatSource: ChatSourceEnum.online
  });
});
```

### 3. Cleaning ProAPI
For `proApi/support/user/team/list`, we will directly reuse the handler from standard `support/user/team/list.ts`.

```typescript
// projects/app/src/pages/api/proApi/support/user/team/list.ts
import handler from '../../api/support/user/team/list';
export default handler;
```

## Security & Impact
- **Auth**: Preserves existing logic where `chatHome` allows `NullPermission` (any logged-in user) and `chatTest` requires `ReadPermission`.
- **Data**: `ChatSource` is correctly preserved for data analytics.
