# FastGPT 权限系统长期迁移策略

**现状总结**:
- `role` 字段在数据库 Schema 中已标记为 "Abandoned" (废弃) 且非必填。
- 业务代码中仍有大量 (100+) 处直接依赖 `role` 字段。
- 主要风险：数据库可能存在无 `role` 字段的数据，导致仅依赖 TS 类型提示的代码在运行时崩溃 (Runtime Crash)。

## 目标架构：权限为体，角色为用 (Permission as Truth, Role as Preset)

您提出的观点非常准确：**角色不应该是一个独立的平行系统，而应该是权限的"打包"（预设）。**

- **唯一真相 (Single Source of Truth)**: `permission` (Bitmask)。所有的后端鉴权 (`Can I do X?`) 仅检查 permission。
- **角色 (Role)**: 仅作为 **"权限套餐"** 或 **"UI 别名"** 存在。
  - **输入端**: 当管理员把某人设为 "Admin" 时，系统实际上是勾选了 `AppCreate | DatasetCreate | Manage` 等一系列权限位。
  - **输出端**: 当某人拥有上述所有权限时，UI 可以友好地显示标签为 "Admin"。如果他只拥有部分权限，UI 显示为 "Custom" (自定义)。

这并不矛盾，反而是现代 RBAC (基于角色的访问控制) 的标准最佳实践。

## 渐进式实施策略：遏制与绞杀 (Contain & Strangle)

鉴于难以一次性重构所有代码，建议采取以下渐进式策略，逐步向目标架构靠拢：

### 1. 防御防线 (Containment) - *已开始执行*
**目标**: 防止程序因 `undefined` role 而崩溃。

- **原则**: 永远不要相信 `member.role` 直接存在。
- **措施**:
  - 在所有关键读取路径（如 API、权限校验函数）中，应用默认值兜底：`const safeRole = member.role || 'member'`.
  - 我们在 `validation.ts` 和 `updateOne/delete` API 中已经实施了此措施。

### 2. 建立抽象层 (Abstraction)
**目标**: 收敛 `role` 的读取方式，逐步隔离旧逻辑。

- **措施**:
  - 创建全局 Helper 函数 `getMemberRole(member)`，统一处理回退逻辑。
  - **禁止**在业务代码中直接访问 `tmb.role`。
  - **新代码规范**: 所有新功能必须使用 `TeamPermission` (如 `tmb.permission.hasAppCreatePer`)，禁止使用 `tmb.role === 'admin'`。

### 3. 数据一致性维护 (Data Consistency)
**目标**: 确保新产生的数据不会破坏旧系统。

- **写入策略**:
  - 当通过 UI 修改权限时，继续根据权限组合推导并写入一个 "兼容性 Role"。
  - 例如：如果用户被赋予了 `Manage` 权限，顺便将其 `role` 字段更新为 `'admin'`，由前端或 API 自动处理。这能保证旧的 UI (显示 "管理员" 标签) 依然正常工作。
  - **但永远不要只写 Role 不写 Permission**。

### 4. 类型系统修正 (Type Safety)
**目标**: 让编译器帮助我们发现问题。

- **建议**:
  - 修改 `packages/global/support/user/team/type.d.ts`:
    ```typescript
    export type TeamMemberSchema = {
      // ...
      /** @deprecated Use permission field instead. This may be undefined. */
      role?: `${TeamMemberRoleEnum}`; // 改为可选
    };
    ```

### 5. 绞杀旧逻辑 (Strangulation)
**目标**: 最终移除 Role 作为鉴权依据。

- **路径**:
  - 逐渐将 `if (role === 'owner')` 替换为 `if (permission.isOwner)` (IsOwner 仍需保留，通常作为最高级特权)。
  - 将 `if (role === 'admin')` 替换为具体的 `if (permission.canManageTeam)`。
  - **终局**: 数据库中的 `role` 字段可以保留用于 UI 快速展示，或者完全移除（每次读 permission 动态计算角色名）。
