---
name: api-development
description: FastGPT API Development Standards. Emphasizes strict Zod schema validation, OpenAPI documentation in `packages/global/openapi`, and `NextAPI` middleware usage.
---

# FastGPT API Development Standards

## 1. Core Principles

- **Schema First**: Define input/output schemas in `packages/global/openapi` first.
- **Strict Validation**: All inputs (`req.body`, `req.query`) must be parsed via Zod.
- **Strict Output**: All responses must match the defined response schema.
- **Middleware**: All API routes must be wrapped with `NextAPI`.

## 2. Development Workflow

### Step 1: Define Schemas & OpenAPI

**File**: `packages/global/openapi/[module]/[feature]/api.ts`

```typescript
import { z } from 'zod';
import { PaginationSchema } from '../../api'; // Common schemas

/* ============================================================================
 * API: [Title]
 * Route: POST /api/core/[module]/[feature]/[action]
 * Method: POST
 * Description: [Description]
 * Tags: ['Module', 'Feature']
 * ============================================================================ */

// 1. Input Schema
export const MyApiBodySchema = z.object({
  appId: z.string().meta({ example: '65xxxxx', description: 'App ID' }),
  name: z.string().min(1).meta({ example: 'Name', description: 'Name' }),
  // Use .optional() for optional fields
  type: z.enum(['type1', 'type2']).optional().meta({ description: 'Type' })
});
export type MyApiBody = z.infer<typeof MyApiBodySchema>;

// 2. Output Schema
export const MyApiResponseSchema = z.object({
  id: z.string().meta({ description: 'ID' }),
  result: z.boolean().meta({ description: 'Success' })
});
export type MyApiResponse = z.infer<typeof MyApiResponseSchema>;
```

### Step 2: Implement API Route

**File**: `projects/app/src/pages/api/core/[module]/[feature]/[action].ts`

```typescript
import type { NextApiResponse } from 'next';
import { NextAPI } from '@/service/middleware/entry';
import type { ApiRequestProps } from '@fastgpt/service/type/next';
import { authApp } from '@fastgpt/service/support/permission/app/auth'; // Auth helpers
import { 
  MyApiBodySchema, 
  MyApiResponseSchema,
  type MyApiResponse 
} from '@fastgpt/global/openapi/...';

async function handler(
  req: ApiRequestProps,
  _res: NextApiResponse
): Promise<MyApiResponse> { // Explicit return type
  // 1. Validate Input
  const { appId, name, type } = MyApiBodySchema.parse(req.body);

  // 2. Auth Check (e.g. App Permission)
  await authApp({
    req,
    authToken: true,
    appId,
    per: 'w' // permission constant
  });

  // 3. Business Logic
  const id = await someController({ appId, name });

  // 4. Validate Output
  // (Ensures no internal fields leak out)
  return MyApiResponseSchema.parse({
    id,
    result: true
  });
}

export default NextAPI(handler);
```

### Step 3: Error Handling

Create errors using standard enums or throw new Errors. `NextAPI` catches them.

```typescript
import { CommonErrEnum } from '@fastgpt/global/common/error/code/common';

if (!exists) {
  return Promise.reject(CommonErrEnum.fileNotFound);
}
```

## 3. Schema Best Practices

- **Meta is Mandatory**: Every field must have `.meta({ description })` for OpenAPI generation.
- **Use `nativeEnum`**: For TS enums `z.nativeEnum(MyEnum)`.
- **Inheritance**: Use `PaginationSchema.extend({})` for lists.

## 4. MongoResourcePermission Operation Rules

> [!CAUTION]
> `MongoResourcePermission` requires `teamId` in all operations. Missing `teamId` causes records to be invisible to list APIs.

### 4.1 Upsert Pattern

When using `updateOne` with `upsert: true`, **ALL required fields must be in both query and $set**:

```typescript
// ✅ CORRECT
await MongoResourcePermission.updateOne(
  {
    resourceType: PerResourceTypeEnum.app,
    resourceId: appId,
    teamId,  // ← REQUIRED in query
    tmbId: ownerId
  },
  {
    $set: {
      permission: OwnerRoleVal,
      teamId  // ← REQUIRED in $set for upsert
    }
  },
  { session, upsert: true }
);

// ❌ WRONG - Missing teamId causes invisible records
await MongoResourcePermission.updateOne(
  {
    resourceType: PerResourceTypeEnum.app,
    resourceId: appId,
    tmbId: ownerId  // ← Missing teamId!
  },
  {
    $set: {
      permission: OwnerRoleVal  // ← Missing teamId!
    }
  },
  { upsert: true }
);
```

### 4.2 Required Fields Reference

| Field | Required | Notes |
|:---|:---:|:---|
| `teamId` | ✓ | Must be in query AND $set for upsert |
| `resourceType` | ✓ | Enum: `app`, `dataset`, `team`, `model` |
| `permission` | ✓ | Integer value from permission constants |
| `resourceId` | * | Required for app/dataset resources |
| `tmbId` / `groupId` / `orgId` | * | At least ONE must be present |
