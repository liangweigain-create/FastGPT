---
name: backend-patterns
description: Backend architecture patterns, API design, database optimization, and server-side best practices customized for FastGPT (Next.js + MongoDB + TypeScript).
---

# FastGPT Backend Development Patterns

FastGPT uses a **Next.js Page Router** based architecture with **Function-based Controllers** and **Mongoose** directly. Development should follow these patterns to ensure consistency and maintainability.

## Core Architecture

### 1. Functional Service/Controller Pattern
FastGPT avoids heavy class-based service layers. Business logic is organized in functional controllers within `packages/service`.

**Directory Structure**:
- Data Schema: `packages/service/support/core/[module]/schema.ts`
- Business Logic: `packages/service/support/core/[module]/controller.ts`
- API Endpoint: `projects/app/src/pages/api/[module]/[action].ts`

**Example Controller (`controller.ts`)**:
```typescript
import { MongoUser } from './schema';
import { CreateUserProps } from '@fastgpt/global/support/user/api';
import { addLog } from '../../../common/system/log';

// Export as async function
export async function createLocalUser(data: CreateUserProps) {
  try {
    // 1. Validation (Runtime validation recommended via Zod, even if not strictly enforced everywhere yet)
    // 2. Database Operation
    const user = await MongoUser.create({
      username: data.username,
      password: data.password // Hash logic usually in Schema setter
    });
    
    return user;
  } catch (error) {
    addLog.error('createLocalUser error', error);
    return Promise.reject(error);
  }
}
```

### 2. API Route Pattern (`NextAPI`)
All Next.js API routes must be wrapped with `NextAPI` middleware for uniform error handling and response formatting.

**Example API Route**:
```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { NextAPI } from '@/service/middleware/entry';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { createLocalUser } from '@fastgpt/service/support/user/controller';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Auth & Permission Check
  const { userId } = await authCert({ req, authToken: true });
  
  // 2. Parse & Validate Body
  const { username, password } = req.body;
  if (!username || !password) {
    throw new Error('Missing parameters');
  }

  // 3. Call Controller
  const user = await createLocalUser({ username, password });

  // 4. Return Data (NextAPI automatically wraps in { code: 200, data: ... })
  return { userId: user._id };
}

export default NextAPI(handler);
```

## Authentication & Authorization

Use `authCert` from `@fastgpt/service/support/permission/auth/common` for all permission checks.

```typescript
// Common options:
const { 
  userId, 
  teamId, 
  tmbId, 
  isRoot 
} = await authCert({
  req,
  authToken: true,  // Check user login token (Cookie/Header)
  authApiKey: true, // Check FastGPT generic API Key
  authRoot: true    // Check if request has ROOT_KEY
});
```

## Database Patterns (Mongoose)

### 1. Direct Model Access
Do not create "Repository Classes". Import `Mongo[ModelName]` directly from `schema.ts`.

### 2. Performance Best Practices
- **Always use `lean()`** for read operations unless you specifically need Mongoose document methods (save, virtuals).
  ```typescript
  // ✅ Good
  const users = await MongoUser.find({ teamId }).lean();
  
  // ❌ Bad (Heavier memory usage)
  const users = await MongoUser.find({ teamId });
  ```
- **Use `Promise.all`** for independent queries.
  ```typescript
  const [total, list] = await Promise.all([
    MongoUser.countDocuments(match),
    MongoUser.find(match).lean()
  ]);
  ```

### 3. Transactions (`mongoSessionRun`)
Use `mongoSessionRun` helper for atomic operations spanning multiple collections.

```typescript
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';

export const createComplexData = async (data: any) => {
  return mongoSessionRun(async (session) => {
    // Pass session to all Create/Update operations
    const [user] = await MongoUser.create([{ ... }], { session });
    await MongoAccount.create([{ userId: user._id, ... }], { session });
    
    return user;
  });
};
```

## Error Handling

- **Throw Errors**: In Controllers or APIs, simply `throw new Error('message')` or throw specific error codes. `NextAPI` middleware captures these and formats the JSON response.
- **Console Logging**: Use `addLog` from `@fastgpt/service/common/system/log` instead of `console.log` for persistent logs.

## Validation (Best Practice)
While the codebase makes heavy use of TypeScript types, **Runtime Validation** is strongly recommended for API inputs.

```typescript
// Recommended pattern
import { z } from 'zod';

const BodySchema = z.object({
  amount: z.number().min(1),
  type: z.enum(['add', 'reduce'])
});

async function handler(req: NextApiRequest) {
  const { amount, type } = BodySchema.parse(req.body);
  // ...
}
```