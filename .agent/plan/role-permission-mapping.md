# 角色-权限映射定义 (Role-Permission Mapping)

为实现 "Role as Preset" 架构，我们首先定义标准角色的权限包。

## 1. 角色定义

### Owner (所有者)
- **描述**: 团队创建者，拥有最高权限。
- **权限包**: `ALL` (隐式或显式全选)。
- **逻辑**: 代码中保留 `isOwner` 检查，作为最高优先级判断。

### Admin (管理员)
- **描述**: 协助管理团队，拥有除转让团队外的绝大多数权限。
- **权限包 (Current)**:
  - `Manage` (人员管理)
  - `AppCreate` (创建应用)
  - `DatasetCreate` (创建知识库)
  - `ApikeyCreate` (创建 API Key)
  - `Read` (基础读权限)
  - `Write` (基础写权限)
- **权限包 (Future - 待添加)**:
  - `InvitationManage` (邀请链接管理)
  - `TeamUpdate` (修改团队信息 - 如允许)
- **Bitmask Value**: `0b111111...` (所有权限位的并集)

### Member (普通成员)
- **描述**: 普通使用者。
- **权限包**:
  - `Read` (基础读权限，访问应用/知识库)
  - **Option**: 未来可降级为 `0` (仅门户访问)，与 `Read` 权限解耦。
- **Bitmask Value**: `0b000100` (Current Default)

## 2. 实施计划

1.  **修改 `TeamRolePermission` 常量**:
    - 显式定义 `TeamAdminPermissionVal`，其值为所有功能权限之和。
    - 确保新添加的权限位 (Invitation, etc.) 自动加入 Admin 权限包。

2.  **创建权限预设函数**:
    ```typescript
    // 伪代码
    function getPresetPermission(role: 'admin' | 'member') {
      if (role === 'admin') return TeamAdminPermissionVal;
      return TeamMemberPermissionVal;
    }
    ```

3.  **UI 适配**:
    - 在成员管理界面，当选择 "管理员" 时，自动勾选所有对应的细粒度权限。
