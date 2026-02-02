# 协作者 API 重构计划

## 1. 背景

目前的协作者管理 API (`list`, `update`, `delete`) 虽然功能可用，但严重违背了 FastGPT 的开发规范 (Skills: `api-development`)。
主要问题：
- 缺少 Zod Schema 定义
- 缺少 API 头部声明 (Route, Method, Tags)
- 入参/出参未经过 `Schema.parse()` 验证
- 类型定义散落在 `.d.ts` 中，而非由 Schema 导出

## 2. 目标

将以下 6 个 API 重构为符合标准的形式：

**Dataset:**
1. `GET /api/core/dataset/collaborator/list`
2. `POST /api/core/dataset/collaborator/update`
3. `POST /api/core/dataset/collaborator/delete` (注：Delete 建议改为 POST 或 DELETE 方法配合 query/body，规范建议 DELETE 尽量少用 body，需确认)

**App:**
4. `GET /api/core/app/collaborator/list`
5. `POST /api/core/app/collaborator/update`
6. `POST /api/core/app/collaborator/delete`

## 3. 实现步骤

### 3.1 定义 Schema (packages/global/openapi)

创建以下文件：
- `packages/global/openapi/core/dataset/collaborator.ts`
- `packages/global/openapi/core/app/collaborator.ts`

**Schema 内容示例 (Dataset Update):**
```typescript
/*
 * API: 更新知识库协作者
 * Route: POST /api/core/dataset/collaborator/update
 * ...
 */
export const UpdateDatasetCollaboratorBodySchema = z.object({
  datasetId: z.string().min(1),
  collaborators: z.array(z.object({
    tmbId: z.string().optional(),
    groupId: z.string().optional(),
    orgId: z.string().optional(),
    permission: z.number()
  }))
});
```

### 3.2 重构后端 API (projects/app/src/pages/api)

对每个 API 文件：
1. 引入对应的 Schema。
2. 使用 `checkRes(handler)` 包裹 (如果是 GET) 或 `NextAPI` (标准入口)。 *注：FastGPT V4 似乎统一用 `NextAPI`*。
3. `const body = Schema.parse(req.body)`。
4. 业务逻辑保持不变（主要是同步 sync 逻辑）。
5. `return ResponseSchema.parse(data)`。

### 3.3 更新前端调用 (web/core)

1. 更新 `web/core/dataset/api/collaborator.ts` 和 `web/core/app/api/collaborator.ts`。
2. 确保请求参数符合新的 Schema 结构。

## 4. 验证计划

1. **类型检查**: `pnpm type-check` 确保没有类型错误。
2. **功能验证**:
   - 打开知识库/应用设置。
   - 打开协作者管理弹窗。
   - 列表是否加载？
   - 添加/移除成员，点击保存，是否成功？
   - 移除单个成员（如果 UI 支持），是否成功？

## 5. 关于 Delete 接口的特殊说明

规范建议 DELETE 请求不带 Body。目前的 Delete 实现支持 Body。
**修正方案**:
建议 Delete 接口统一改为 POST `.../delete` 或者坚持 DELETE 方法但参数全放 Query (如果参数不敏感且长度允许)。
考虑到 `tmbId`, `groupId`, `orgId` 可能组合出现，且为了统一，**维持 DELETE 方法，但确保前端将参数放在 URL Query 中**（Axios `DELETE` 的 `params` 选项）。
Schema 定义时，Delete 的入参应该是 `QuerySchema` 而不是 `BodySchema`。

---
*Created by Agent based on .agent/rules/coding-guide.md*
