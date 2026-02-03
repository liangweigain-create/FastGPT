---
name: frontend-patterns
description: Frontend development patterns for React, Next.js, state management, performance optimization, and UI best practices in FastGPT.
---

# FastGPT Frontend Patterns

FastGPT uses a modern React stack optimized for performance and type safety.

## 1. State Management (Zustand)
FastGPT uses **Zustand** for global state management, often combined with `immer` for mutable updates and `persist` for local storage.

```typescript
import { create, devtools, persist, immer } from '@fastgpt/web/common/zustand';

type State = {
  isValid: boolean;
  setIsValid: (val: boolean) => void;
  updateNested: (id: string, name: string) => void;
};

export const useMyStore = create<State>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Simple state
        isValid: false,
        setIsValid(val) {
          set((state) => {
            state.isValid = val;
          });
        },
        // Immutable updates via Immer
        updateNested(id, name) {
          set((state) => {
             // Direct mutation allowed here due to Immer
             state.items[id].name = name;
          });
        }
      })),
      {
        name: 'my-store-storage-key' // Persist key
      }
    )
  )
);
```

## 2. Data Fetching (useRequest)
Do **not** use `useEffect` + `fetch` for data loading. Use the custom `useRequest` hook (wrapper around `ahooks` & `tanstack-query` concepts) which handles:
- Automatic error/success toasts
- Loading states
- Manual/Auto triggering

```typescript
import { useRequest } from '@fastgpt/web/hooks/useRequest';
import { getAppList } from '@/web/core/app/api';

// In Component
const { 
  run,        // Manual trigger 
  loading, 
  data 
} = useRequest(getAppList, {
  manual: false, // Auto run on mount
  successToast: 'Loaded successfully', // Optional toast
  errorToast: 'Failed to load',        // Optional toast
  onSuccess: (res) => {
    console.log(res);
  }
});
```

## 3. Form Handling (react-hook-form)
For complex forms, use **react-hook-form** combined with **Chakra UI**.

```typescript
import { useForm } from 'react-hook-form';
import { Input, Button } from '@chakra-ui/react';

const MyForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  
  const onSubmit = (data) => console.log(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input {...register('username', { required: true })} />
      <Button type="submit">Submit</Button>
    </form>
  );
};
```

## 4. Components & UI (Chakra UI)
- **Layout**: Use `Box`, `Flex`, `Grid`, `Stack` (HStack/VStack) for almost all layouts.
- **Styling**: Use system props (`bg`, `p`, `m`, `color`) instead of CSS classes or styled-components.
- **Icons**: Use `@fastgpt/web/components/common/MyIcon` or typical icon sets imported as components.

## 5. Performance
- **Memoization**: Use `React.memo` for list items or expensive render components.
- **Dynamic Import**: Lazy load modals or heavy charts using `dynamic` from `next/dynamic`.

```typescript
import dynamic from 'next/dynamic';
const HeavyChart = dynamic(() => import('./Chart'), { ssr: false });
```

## 6. Internationalization (i18n)
Use `useTranslation` hook for all text content.

```typescript
import { useTranslation } from 'next-i18next';

const { t } = useTranslation();
// Usage: {t('common:confirm')}
```