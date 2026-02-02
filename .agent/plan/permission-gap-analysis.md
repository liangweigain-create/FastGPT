# 权限体系缺口分析清单 (Role-Only Permissions)

目前系统中有以下核心功能完全依赖硬编码的 `Role` 检查，而没有对应的 `TeamPermission` 权限位：

## 1. 邀请链接管理 (Invitation Management)
- **现状**: API (`create`, `delete`, `list`, `forbid`) 显式检查 `role === 'owner' || role === 'admin'`。
- **缺口**: 没有任何 Permission 控制 "能否创建/管理邀请链接"。
- **建议**: 新增 `TeamInvitationManage` (管理邀请) 权限位。

## 2. 团队基础信息管理 (Team Update)
- **现状**: `update.ts` (Team info update) 通常检查 `owner` 角色。
- **缺口**: "修改团队名称/头像" 等操作没有独立权限。
- **建议**: 新增 `TeamUpdate` (更新团队信息) 权限位，或归入更高级的 `TeamAdmin`。

## 3. 计费与订阅 (Billing & Subscription)
- **现状**: 涉及钱的操作通常仅限 `Owner`。
- **缺口**: 缺乏 "财务管理员" 概念。
- **建议**: 暂时保持 Owner Only，或新增 `TeamBilling` 权限（视需求而定）。

## 4. 成员管理 (Member Management) 的残留
- **现状**: 虽然有 `manage` 权限 (对应 `TeamManagePermissionVal`)，但在 `collaborator/update.ts` 等文件中，仍存在 `if (role === 'admin')` 的旧代码。
- **目标**: 将所有 `admin` 检查彻底替换为 `permission.hasManagePer`。

## 5. 知识库/应用/API Key 的 Owner 逻辑
- **现状**: 很多 Create 接口会检查是否是 Owner 以跳过限制。
- **目标**: 确保 `checkCanUpdatePermission` 等统一校验函数能正确处理 "Owner = Root Privilege" 的逻辑，而不再分散在各个 API 中。
