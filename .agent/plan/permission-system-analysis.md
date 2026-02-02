# FastGPT 权限系统分析报告

## 1. 问题概述

当前系统存在 **两套独立的权限系统**，它们之间没有良好的协调，导致了以下问题：
1. Admin 角色即使被关闭了权限Tab中的所有权限，仍然可以自己打开
2. 两套权限系统各自控制什么功能不清晰
3. 权限逻辑不一致，给用户造成困惑

---

## 2. 两套权限系统详解

### 2.1 第一套：角色层 (TeamMemberRoleEnum)

| 角色 | 说明 | 权限范围 |
|------|------|----------|
| `owner` | 团队所有者 | 拥有所有权限 |
| `admin` | 管理员 | **部分功能**的硬编码权限检查 |
| `member` | 普通成员 | 基础权限 |

**定义位置**: `packages/global/support/user/team/constant.ts`

```typescript
// 第5-9行
export enum TeamMemberRoleEnum {
  owner = 'owner',
  admin = 'admin',
  member = 'member'
}
```

**存储位置**: `team_members` 集合中的 `role` 字段

**这套系统控制的功能** (通过硬编码检查 `tmb.role`):
- 邀请链接管理 (仅 owner/admin 可操作)
  - `projects/app/src/pages/api/support/user/team/invitationLink/list.ts`
  - `projects/app/src/pages/api/support/user/team/invitationLink/create.ts`
  - `projects/app/src/pages/api/support/user/team/invitationLink/forbid.ts`
  - `projects/app/src/pages/api/support/user/team/invitationLink/delete.ts`

```typescript
// 硬编码检查示例
if (!tmb || (tmb.role !== TeamMemberRoleEnum.owner && tmb.role !== TeamMemberRoleEnum.admin)) {
  throw new Error('Permission denied');
}
```

---

### 2.2 第二套：细粒度权限层 (TeamPermission)

使用 **位运算** 存储权限值，支持更精细的权限控制。

| 权限 | 位值 | 说明 |
|------|------|------|
| `manage` | `0b000001` | 管理权限（可设置其他成员权限） |
| `write` | `0b000010` | 写入权限 |
| `read` | `0b000100` | 读取权限 |
| `appCreate` | `0b001000` | 创建应用权限 |
| `datasetCreate` | `0b010000` | 创建知识库权限 |
| `apikeyCreate` | `0b100000` | 创建 API Key 权限 |

**定义位置**: `packages/global/support/permission/user/constant.ts`

**存储位置**: `resource_permissions` 集合

**这套系统控制的功能**:
- 团队内资源创建权限 (应用/知识库/API Key)
- 资源的协作者权限管理
- 通过 `hasManagePer`、`hasAppCreatePer` 等属性进行检查

**UI 展示位置**: 团队管理 → 权限 Tab
- `projects/app/src/pageComponents/account/team/PermissionManage/index.tsx`

---

## 3. 核心问题分析

### 3.1 Admin 自己能打开权限的问题

**问题代码** (`PermissionManage/index.tsx` 第283-305行):

```tsx
// 成员权限复选框的禁用逻辑
<PermissionCheckBox
  isDisabled={member.permission.hasManagePer && !userInfo?.permission.isOwner}
  role={TeamAppCreateRoleVal}
  ...
/>
```

**漏洞分析**:
- `isDisabled` 条件：只有当目标成员有 `manage` 权限且当前用户不是 Owner 时才禁用
- 问题：admin 用户只要有 `manage` 权限，就可以修改自己的其他权限 (appCreate/datasetCreate 等)
- 更严重的是：admin 可以给自己添加 `manage` 权限（第301行 `isDisabled={!userInfo?.permission.isOwner}`）

**后端校验问题**:
- `collaborator/list.ts` 只做了身份认证 (`authCert`)
- 没有校验当前用户是否有权限修改目标用户的权限

### 3.2 两套系统不协调

| 场景 | 角色层 (TeamMemberRoleEnum) | 权限层 (TeamPermission) | 问题 |
|------|---------------------------|------------------------|------|
| admin 管理邀请链接 | ✅ 硬编码允许 | ❌ 不检查 | 权限来源不一致 |
| admin 创建应用 | ❌ 不检查 | ✅ 需要 appCreate 权限 | 绕过角色检查 |
| admin 修改权限 | ❌ 不检查 | ⚠️ 前端禁用但可绕过 | 安全漏洞 |

---

## 4. 关键文件路径汇总

### 定义层
| 文件 | 说明 |
|------|------|
| `packages/global/support/user/team/constant.ts` | TeamMemberRoleEnum 定义 |
| `packages/global/support/permission/constant.ts` | 通用权限常量 (read/write/manage) |
| `packages/global/support/permission/user/constant.ts` | 团队权限常量 (appCreate/datasetCreate/apikeyCreate) |
| `packages/global/support/permission/controller.ts` | Permission 类实现 |
| `packages/global/support/permission/user/controller.ts` | TeamPermission 类 |

### 后端层
| 文件 | 说明 |
|------|------|
| `packages/service/support/permission/controller.ts` | 权限查询和同步逻辑 |
| `packages/service/support/permission/schema.ts` | MongoResourcePermission 模型 |
| `projects/app/src/pages/api/support/user/team/collaborator/list.ts` | 获取团队协作者 API |

### 前端层
| 文件 | 说明 |
|------|------|
| `projects/app/src/pageComponents/account/team/PermissionManage/index.tsx` | 权限管理 Tab UI |
| `projects/app/src/pages/account/team/index.tsx` | 团队页面入口 |

---

## 5. 修复建议

### 方案一：统一到权限层 (推荐)

1. **废弃 TeamMemberRoleEnum 的权限控制功能**
   - 保留 `role` 字段仅作为显示用途
   - 所有权限检查都使用 TeamPermission

2. **增强后端校验**
   ```typescript
   // 在修改权限的 API 中添加检查
   if (!userInfo.permission.isOwner) {
     if (targetMember.permission.hasManagePer) {
       throw new Error('Cannot modify manager permissions');
     }
     if (!userInfo.permission.hasManagePer) {
       throw new Error('No permission to modify');
     }
   }
   ```

3. **修复前端禁用逻辑**
   - 非 Owner 不能修改任何人的 `manage` 权限
   - 非 Owner 不能修改有 `manage` 权限的人的任何权限

### 方案二：角色层优先

1. **让 TeamMemberRoleEnum 成为权限的主要来源**
   - Owner: 全部权限
   - Admin: 固定的管理权限集
   - Member: 通过 TeamPermission 控制细粒度

2. **角色决定权限上限**
   - Member 的 TeamPermission 不能超过 Admin 的能力范围

---

## 6. 下一步行动

1. 确认采用哪个修复方案
2. 制定详细的实现计划
3. 编写测试用例
4. 实施修复
