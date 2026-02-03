---
name: tdd-workflow
description: FastGPT Test-Driven Development workflow using Vitest. Enforces 80%+ coverage for new features and bug fixes.
---

# FastGPT TDD Workflow

FastGPT uses **Vitest** for all testing (Unit, Integration, Workflow).

## 1. When to Write Tests

- **New Features**: Write integration tests for APIs first.
- **Bug Fixes**: Write a reproducing test case before fixing.
- **Refactoring**: Ensure existing tests pass; add missing coverage if needed.

## 2. Test Commands

| Command | Description |
|:---|:---|
| `pnpm test` | Run all tests (Unit + Integration) |
| `pnpm test:workflow` | Run workflow-specific tests |
| `pnpm test -- path/to/file.test.ts` | Run single test file |
| `pnpm test --coverage` | Generate coverage report |

## 3. FastGPT Test Infrastructure (CRITICAL)

> [!CAUTION]
> FastGPT uses a **per-test database isolation model**. Failure to understand this will cause repeated test failures.

### 3.1 Database Lifecycle

The test setup file (`test/setup.ts`) does the following:

```
beforeAll  → Connect to MongoDB (per test FILE)
beforeEach → Re-connect to MongoDB
            onTestFinished → clean() + dropDatabase()
afterAll   → Close MongoDB connection
```

**Key Implication**: **NEVER use `beforeAll` for creating test data** (users, apps, permissions). Data will be dropped after the first test in the file.

### 3.2 Correct Pattern: Create Data Inside Each `it` Block

```typescript
// ✅ CORRECT
it('should transfer app ownership', async () => {
  // Setup INSIDE the it block
  const users = await getFakeUsers(3);
  await MongoResourcePermission.findOneAndUpdate(...);
  
  // Arrange, Act, Assert
  const app = await createApp({ auth: users.members[0], ... });
  const res = await changeOwner({ appId: app._id, ownerId: users.members[1].tmbId });
  expect(res.code).toBe(200);
});

// ❌ WRONG - Data will not exist in subsequent tests
let users: any;
beforeAll(async () => {
  users = await getFakeUsers(3); // Will be dropped after first test!
});
```

### 3.3 Test Pattern Lookup Workflow

Before writing a new test:

1. **Find a similar existing test** (e.g., `create.test.ts` for CRUD APIs).
2. **Copy the exact structure** (imports, user setup, permission grants).
3. Only modify the API-specific logic.

Reference tests:

| API Type | Reference File |
|:---|:---|
| App CRUD | `projects/app/test/api/core/app/create.test.ts` |
| Permission | `test/cases/service/support/permission/controller.test.ts` |
| Chat | `projects/app/test/api/core/chat/history/getHistories.test.ts` |

## 4. Workflow (Red-Green-Refactor)

1. **Red**: Write the test file describing the requirements. Run `pnpm test -- path/to/file.test.ts` → Fail.
2. **Green**: Implement the minimal code. Run `pnpm test` → Pass.
3. **Refactor**: Clean up code. Ensure tests still pass.

> [!IMPORTANT]
> If tests fail, **check business logic first**. Only modify tests if:
>
> - (a) The test itself has assertion bugs, OR
> - (b) The test infrastructure pattern is wrong.

## 5. Debugging Test Failures

When a test fails with an unexpected error:

| Error | Likely Cause | Solution |
|:---|:---|:---|
| `member not exist` | User/TMB not in DB | Move `getFakeUsers()` inside `it` block |
| `unAuthApp` | Missing permission | Add `MongoResourcePermission.findOneAndUpdate(...)` with correct permission |
| `createRes.data undefined` | API returned error | Check `createRes.error` first, not just `data` |
| `500` error | Business logic bug | Debug the actual API handler |

## 6. Coverage Goal

Aim for **80% coverage** on business logic modules.

- **Critical**: Payment, Permissions, Workflow Execution.
- **Less Critical**: UI Components (prefer manual verification or snapshot if stable).

## 7. Key Files Reference

| File | Purpose |
|:---|:---|
| `test/setup.ts` | Per-file setup: MongoDB connection, `beforeEach` with DB cleanup |
| `test/globalSetup.ts` | Global setup: starts `mongodb-memory-server` |
| `test/mocks/request.ts` | Mocks for `parseHeaderCert`, `NextEntry` |
| `test/datas/users.ts` | `getFakeUsers()`, `getUser()`, `getFakeGroups()` |
| `test/utils/request.ts` | `Call()` utility for invoking API handlers |
| `vitest.config.mts` | Vitest configuration (aliases, setup files, parallelism) |
