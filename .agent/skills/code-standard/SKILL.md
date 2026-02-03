---
name: coding-standards
description: Universal coding standards, best practices, and patterns for TypeScript, JavaScript and React development in FastGPT.
---

# FastGPT Coding Standards

## 1. Directory & File Structure

### Components
FastGPT prefers a **Folder-based** structure for components to keep styles, types, and sub-components together.

```
// ✅ GOOD
components/
  MyButton/
    index.tsx        // Component implementation
    type.d.ts        // (Optional) Component specific types
    constants.ts     // (Optional) Component constants (if validation schemas etc)

// ❌ BAD
components/
  MyButton.tsx       // Avoid single files for complex components
```

### File Naming
- **Components**: PascalCase (e.g. `EditModal/index.tsx`)
- **Utilities/Hooks**: camelCase (e.g. `useRequest.ts`, `format.ts`)
- **API**: camelCase matching the route (e.g. `pages/api/core/app/create.ts`)

## 2. React Best Practices (Frontend)

### API Requests
Do **not** use `fetch` or `axios` directly in components. Use the global request helpers which handle token auth and error toasts automatically.

```typescript
import { GET, POST, PUT, DELETE } from '@/web/common/api/request';

// ✅ GOOD
export const createItem = (data: CreateItemProps) => 
  POST<string>('/core/item/create', data);

// ❌ BAD
export const createItem = (data) => fetch('/api/core/item/create', ...)
```

### Component Structure
Use **Functional Components** with explicit `Props` types. default export `React.memo` unless state is highly volatile.

```typescript
import React from 'react';
import { Box, Button } from '@chakra-ui/react';

interface Props {
  title: string;
  onClick: () => void;
}

const MyComponent = ({ title, onClick }: Props) => {
  return (
    <Box>
      <Button onClick={onClick}>{title}</Button>
    </Box>
  );
};

export default React.memo(MyComponent);
```

### UI Library
FastGPT uses **Chakra UI**. Avoid writing raw CSS/SCSS files. Use Chakra's system props (`Box`, `Flex`, `Grid`) for layout.

## 3. TypeScript/JavaScript Standards

### Immutability (CRITICAL)
Always create new objects/arrays instead of mutating.

```typescript
// ✅ GOOD
const updatedState = { ...state, isActive: true };
const newItems = [...items, newItem];

// ❌ BAD
state.isActive = true;
items.push(newItem);
```

### Null/Undefined Handling
Prefer Optional Chaining (`?.`) and Nullish Coalescing (`??`).

```typescript
// ✅ GOOD
const name = user?.profile?.name ?? 'Anonymous';

// ❌ BAD
const name = (user && user.profile && user.profile.name) || 'Anonymous';
```

## 4. Backend Standards (brief)
*Refer to `backend-patterns` skill for detailed Backend Architecture.*

- **Controller**: Use Functional Controllers.
- **Validations**: Validate inputs (runtime) before business logic.
- **Database**: Use Mongoose models directly. `Promise.all` for parallel queries.

## 5. Commenting
- **Docstrings**: Use `/** ... */` for exported functions/APIs to provide TSDoc.
- **Logic**: Comment *Why*, not *What*.

## 6. Testing
- *Refer to `tdd-workflow` skill for detailed TDD and testing guidelines.*