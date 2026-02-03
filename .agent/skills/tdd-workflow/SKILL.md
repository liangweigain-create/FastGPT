---
name: tdd-workflow
description: FastGPT Test-Driven Development workflow using Vitest. Enforces 80%+ coverage for new features and bug fixes.
---

# FastGPT TDD Workflow

FastGPT uses **Vitest** for all testing (Unit, Integration, Workflow). 

## 1. When to Write Tests
*   **New Features**: Write integration tests for APIs first.
*   **Bug Fixes**: Write a reproducing test case before fixing.
*   **Refactoring**: Ensure existing tests pass; add missing coverage if needed.

## 2. Test Commands (`package.json`)
*   `pnpm test`: Run all tests (Unit + Integration).
*   `pnpm test:workflow`: Run workflow-specific tests.
*   `pnpm test --coverage`: Generate coverage report.

## 3. Testing Principles

### Backend Integration Tests
FastGPT relies heavily on **Integration Tests** for API routes (`projects/app/src/pages/api/...`).
**Key Pattern**:
- **Mock DB Connection**: Uses a test-specific Mongo connection (often utilizing `mongodb-memory-server` in CI or a local test DB).
- **Mock External Services**: Mock OpenAI/Vector responses to avoid external calls.

```typescript
// Example: test/cases/service/inform.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
// Ensure DB is connected (see hooks)
import { connectToDatabase, clearDatabase } from '@/test/utils/db'; 

describe('Inform Service', () => {
  beforeAll(async () => await connectToDatabase());
  afterAll(async () => await clearDatabase());

  it('should create a notification', async () => {
    // 1. Arrange
    const payload = { ... };
    // 2. Act
    const res = await callApi(payload);
    // 3. Assert
    expect(res.status).toBe(200);
    const inDb = await MongoUserInform.findOne({ ... });
    expect(inDb).toBeTruthy();
  });
});
```

### Mocking Guidelines (`vi.mock`)
Use `vi.mock` to stub external calls.

```typescript
import { vi } from 'vitest';

// Mock OpenAI
vi.mock('@fastgpt/service/core/ai/client', () => ({
  getAIApi: vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({ choices: [{ message: { content: 'mock' } }] })
      }
    }
  }))
}));
```

## 4. Workflow (Red-Green-Refactor)
1.  **Red**: Write the test file (`tests/cases/...` or `__tests__`) describing the requirements. Run `pnpm test` -> Fail.
2.  **Green**: Implement the minimal code in `packages/service` or `projects/app`. Run `pnpm test` -> Pass.
3.  **Refactor**: Clean up code. Ensure tests still pass.

## 5. Coverage Goal
Aim for **80% coverage** on business logic modules. 
- **Critical**: Payment, Permissions, Workflow Execution.
- **Less Critical**: UI Components (prefer manual verification or snapshot if stable).