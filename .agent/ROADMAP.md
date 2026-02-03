# FastGPT Project Roadmap

> **Last Updated**: 2026-02-04
> **Session**: Change Owner Bug Fix + TDD Implementation

## 1. 项目概述

FastGPT 是一个 AI Agent 构建平台，采用 Next.js + MongoDB + TypeScript 技术栈。
当前主要工作：**私有化部署优化** - 将依赖商业 API 的功能本地化实现。

## 2. 已完成工作

### 2.1 Chat API 重构
- [x] `chatHome.ts` - 首页聊天 API 本地化
- [x] `chatTest.ts` - 测试聊天 API 重构
- [x] 共享 controller 创建

### 2.2 账户系统完善
- [x] 批量导入用户（支持 `memberName` 字段）
- [x] 用户名更新 API (`updateName.ts`, `updateNameByManager.ts`)
- [x] 审计日志 API (`audit/list.ts`)
- [x] 用户禁用功能 (ROOT-only)
- [x] 用量日志本地 API
- [x] 通知系统本地 API + Schema + Controller

### 2.3 权限系统 Bug 修复
- [x] **Change Owner Bug**: 修复智能体所有权转移后协作者列表不更新的问题
  - **根本原因**: `changeOwner.ts` 的 upsert 操作缺少 `teamId` 字段
  - **修复文件**: `projects/app/src/pages/api/core/app/changeOwner.ts`
  - **测试文件**: `test/cases/api/app/changeOwner.test.ts` (4 个测试全部通过)

### 2.4 开发规范更新
- [x] `tdd-workflow` Skill - 添加 FastGPT 测试基础设施规则
- [x] `api-development` Skill - 添加 `MongoResourcePermission` 操作规范
- [x] 移除 `test/setup.ts` 中的无效 `delay(1000)` 代码

## 3. 待办事项

### 3.1 代码质量

- [x] 修复 `inform.test.ts` 的 MongoDB 认证问题

### 3.2 ProAPI 私有化

- [x] 扫描并审计所有 `getProApiData` 调用
- [/] **ProAPI 修复追踪** (持续更新直到清零)
    - [x] Chat Settings (优先级: 高)
    - [ ] Billing Dashboard (优先级: 中)
    - [ ] Dataset File Read (优先级: 低)

### 3.3 测试覆盖率

- [ ] 为更多关键 API 添加 TDD 测试
- [ ] 目标: 80% 覆盖率

## 4. 开发模式与规范

### 4.1 TDD 工作流

1. **Red**: 先写测试，运行失败
2. **Green**: 实现最小代码，测试通过
3. **Refactor**: 重构代码

**关键**: 测试应该尽可能接近用户行为，验证 API 返回而非仅验证 DB 状态。

### 4.2 测试基础设施
- `test/setup.ts` 在 `beforeEach` 中 drop 数据库
- **禁止在 `beforeAll` 中创建测试数据**（数据会在第一个测试后丢失）
- 必须在每个 `it` 块内部创建用户和权限

### 4.3 权限系统规范
- **禁止直接访问 `tmb.role` 或 `member.role`**
- 使用 `getSafeTeamMemberRole(member)` 获取角色
- 权限判断优先使用 `TeamPermission` (如 `hasAppCreatePer`)

### 4.4 MongoResourcePermission 操作
- **所有 upsert 操作必须包含 `teamId`**（查询条件 + $set）
- 参考 `api-development` Skill 中的规范

## 5. 关键文件参考

| 文件 | 用途 |
|:---|:---|
| `test/setup.ts` | 测试生命周期（DB 连接、清理） |
| `test/datas/users.ts` | 测试用户创建工具 |
| `packages/service/support/permission/schema.ts` | 权限 Schema 定义 |
| `packages/global/support/permission/controller.ts` | Permission 类 |
| `.agent/skills/tdd-workflow/SKILL.md` | TDD 开发规范 |
| `.agent/skills/api-development/SKILL.md` | API 开发规范 |

## 6. 注意事项

1. **代码修改标记**: 所有较大修改必须注释 `[Privatization]`
2. **测试优先**: 修 bug 前先写复现测试
3. **字段完整性**: 使用 `MongoResourcePermission` 时确保所有必填字段存在
