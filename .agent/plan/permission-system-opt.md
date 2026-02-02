# FastGPT 权限系统优化设计文档

## 1. 现状深度分析

经过代码扫描，FastGPT 目前的权限架构呈现 "双轨制"：

### 1.1 角色系统 (`TeamMemberRoleEnum`)
**使用频率**: 高 (约 100+ 处引用)
**核心用途**:
1.  **最高权限判定**: 几乎所有 `isOwner` 逻辑都依赖 `role === 'owner'`。
2.  **系统级操作**: 邀请链接管理、团队解散、计费管理等敏感操作直接硬编码检查 `owner` 或 `admin`。
3.  **UI 展示**: 成员列表中的 "身份" 标签。

**风险点**:
- 很多 API 直接检查 `tmb.role === 'admin'`，而忽略了 `Permission` 系统中具体的细粒度权限配置。
- **特权固化**: Admin 角色的权限被写死在代码里，无法通过配置削减（例如想让某个 Admin 不能邀请人，目前做不到）。

### 1.2 权限系统 (`TeamPermission`)
**使用频率**: 中 (约 70+ 处引用)
**核心用途**:
1.  **资源生产力**: `appCreate` (创建应用), `datasetCreate` (创建知识库).
2.  **协作管理**: `manage` (管理其他成员).
3.  **UI 显隐**: 侧边栏按钮、创建按钮的显示/隐藏。

**风险点**:
- **权限越权**: 拥有 `manage` 权限的用户（通常是 Admin）在前端 UI 上看似受到限制，但后端 API (`updateMemberPermission`) 缺乏自我修改的防御检测。

---

## 2. 核心问题定位

### 2.1 "Admin 自提权" 漏洞
在 `projects/app/src/pages/api/support/user/team/collaborator/updateOne.ts` (及相关 update 接口) 中：
- **逻辑缺失**: 仅检查了请求发起人是否有 `manage` 权限。
- **漏洞**: 没有检查请求发起人是否正在**修改自己的权限**，或者**修改比自己更高权限者(Owner)的权限**。
- **结果**: 一个被勾选了 "Manager" 权限的普通成员（或 Admin），可以调用 API 给自己勾选 "App Create" 等所有其他权限。

### 2.2 权限展示与实际生效不一致
- **场景**: 代码中某些地方写着 `if (role === 'admin') allow()`。
- **UI**: 权限管理 Tab 里即使把 Admin 的所有钩子都去掉，他在上述代码场景下依然拥有权限。
- **后果**: 用户困惑，认为权限配置不生效。

---

## 3. 优化方案 (渐进式)

为了避免"牵一发而动全身"导致系统 Bug，我们采用 **三步走** 策略。

### 第一阶段：安全加固 (Fix Bugs Only)
**目标**: 修复逻辑漏洞，不改变现有业务行为。

1.  **后端 API 加固 (`updateMemberPermission`)**:
    - 增加检查: `Current User` 不能修改 `Current User` 自己的权限。
    - 增加检查: `Current User` (非 Owner) 不能修改 `Target User` (Owner) 的权限。
    - 增加检查: 只有 `Owner` 可以赋予或移除其他人的 `Manage` 权限（防止 Admin 滥用管理权创造新的 Admin）。

2.  **前端 UI 修复 (`PermissionManage`)**:
    - 修复 `isDisabled` 逻辑，正确反映上述后端限制。
    - 明确禁止操作自己的行。

### 第二阶段：逻辑统一 (Refactor)
**目标**: 让 Admin 角色与 Permission 系统对齐。

1.  **Admin 语义降级**:
    - 将 `TeamMemberRoleEnum.admin` 仅仅视为一个 **"权限预设组" (Preset)**。
    - 当用户被设为 Admin 时，自动勾选所有 Permission 选项。
    - **关键变更**: 允许取消 Admin 的某些细粒度权限。如果权限不满足默认 Admin 标准，UI 上可以显示为 "Custom" 或 "Admin (Modified)"。

2.  **消除硬编码**:
    - 逐步将 API 中的 `tmb.role === 'admin'` 替换为 `tmb.permission.hasManagePer` 或具体业务权限检查。
    - **保留**: `tmb.role === 'owner'` 检查保留，Owner 仍然是不可撼动的超级管理员。

### 第三阶段：UI/UX 优化
**目标**: 清晰的权限视觉反馈。

1.  **分离角色与权限 UI**:
    - 界面上不再混用 Role 和 Permission。
    - 只有 Owner 能更改成员的角色 (Member vs Admin)。
    - 更改角色时，自动应用一套 Permission 模板。
    - 之后可以手动微调 Permission，微调后角色显示为 "Custom"。

---

## 4. 实施计划 (本次任务)

鉴于您"不敢乱改"的担忧，我们 **仅执行第一阶段**。

### 4.1 待修改文件
1.  **UI**: `projects/app/src/pageComponents/account/team/PermissionManage/index.tsx`
    - 修改 Checkbox 的 disabled 逻辑。
2.  **API**: `projects/app/src/pages/api/support/user/team/collaborator/updateOne.ts` (以及 update.ts)
    - 添加权限校验中间件逻辑。

### 4.2 验证案例
1.  **Self-Edit**: Admin 尝试修改自己的权限 -> **禁止**。
2.  **Cross-Edit**: Admin 尝试修改 Owner 的权限 -> **禁止**。
3.  **Manage-Edit**: Admin 尝试赋予普通成员 Manage 权限 -> **禁止** (仅 Owner 可操作 Manage 权限)。
4.  **Normal-Edit**: Admin 修改普通成员的 AppCreate 权限 -> **允许**。

## 5. 总结
我们先不动 `TeamMemberRoleEnum` 的定义，而是通过收紧 `update` 接口的口子，解决最核心的"权限混乱"和"越权"问题。这最安全。
