---
name: update-roadmap
description: Triggers when user explicitly asks to update the roadmap. This signals a session handoff - agent must update ROADMAP.md with all context for the next agent.
---

# Update Roadmap Skill

## When to Trigger

- User explicitly says "更新 roadmap" or "update roadmap"
- User indicates they want to switch to a new conversation window
- User asks to "prepare handoff" or "prepare context for next session"

## What This Means

**This is a session handoff signal.** The conversation window is getting too long, and the user wants to start a fresh session. You must:

1. Update the roadmap file with ALL context the next agent needs
2. Ensure the next agent can immediately continue development

## How to Update Roadmap

### File Location

`/Users/skye/leo/javascript-projects/FastGPT/.agent/ROADMAP.md`

### Required Sections

1. **Last Updated**: Current date
2. **已完成工作**: All tasks completed in this session
3. **待办事项**: Remaining tasks
4. **开发模式与规范**: Key development patterns and rules
5. **关键文件参考**: Important files the next agent should know
6. **注意事项**: Critical warnings or gotchas

### What to Include

- **Bug fixes**: Root cause, affected files, test files
- **New features**: Implementation details, API changes
- **Lessons learned**: Issues encountered, solutions found
- **Development patterns**: TDD workflow, permission rules, etc.
- **Critical warnings**: Things that can break if not followed

### Example Entry

```markdown
### 2.3 权限系统 Bug 修复
- [x] **Change Owner Bug**: 修复智能体所有权转移后协作者列表不更新的问题
  - **根本原因**: `changeOwner.ts` 的 upsert 操作缺少 `teamId` 字段
  - **修复文件**: `projects/app/src/pages/api/core/app/changeOwner.ts`
  - **测试文件**: `test/cases/api/app/changeOwner.test.ts` (4 个测试全部通过)
```

## After Updating

1. Notify user that roadmap has been updated
2. Confirm the user can switch to a new conversation window
3. Remind user to reference `.agent/ROADMAP.md` in the new session

## Important Notes

- **Be comprehensive**: The next agent has NO context from this conversation
- **Be specific**: Include file paths, function names, line numbers
- **Be actionable**: Next agent should know exactly what to do next
