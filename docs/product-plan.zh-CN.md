# ServiceNow Automation 产品计划（中文）

## 背景

当前项目是从旧 Service Desk 自动化工具的需求和经验中重建一个新的、通用的、可展示的 ServiceNow Automation Workbench。旧项目不再作为代码基础，只作为产品行为和服务台流程参考。

## 战略目标

1. 在 2026-06-05 前做出可以演示的 MVP。
2. 项目定位服务于内部转岗、面试展示和未来可复用的 ITSM 自动化能力。
3. 强调“IT Operations + Service Desk + ServiceNow + AI Automation + Knowledge Management”。
4. 设计成可插拔架构，未来换公司/项目时只需要替换 profile、KB 和 adapter。

## 用户角色

- Service Desk Agent：使用工具整理问题、生成工单草稿、匹配 KB、填入 ServiceNow。
- Team Lead / Hiring Manager：通过 Demo 理解业务价值和技术判断。
- Project Owner（Alan）：验收功能、确认 demo 内容、决定是否扩展真实环境接入。

## 核心价值

- 减少重复开票和写 Work Notes 的时间。
- 提高 ServiceNow 字段填写一致性。
- 把分散在 Teams、邮件、聊天和知识库里的信息整理成标准 Incident 草稿。
- 保留人工审核和 ITSM 合规边界。

## 最小闭环

```text
手动输入问题
→ 提取问题类型和关键信息
→ 匹配本地 KB
→ 生成可编辑 TicketDraft
→ 人工确认
→ 填入 Mock ServiceNow 表单
→ 不自动提交
```

## 6 月 5 日前每日主线

- 05-18/19：范围冻结、仓库创建、项目文档、开发任务拆分
- 05-19/20：Electron + React + TypeScript scaffold
- 05-20/21：core models + Zod schemas
- 05-21/22：Manual Paste Adapter
- 05-22/23：MockAIProvider + structured draft
- 05-23/24：demo profile + KB search
- 05-24/25：Ticket Draft review UI
- 05-25/26：Mock ServiceNow form fill
- 05-26/27：Browser session shell
- 05-27/28：Safe web capture prototype
- 05-29：three scenario hardening
- 05-30/31：中英文文档
- 06-01：Word overview draft
- 06-02：E2E 测试和修 bug
- 06-03：build/package dry run
- 06-04：录屏彩排，冻结新功能
- 06-05：最终 Demo

## 验收口径

不是“全自动操作生产 ServiceNow”，而是展示一个安全的服务台自动化工作台：AI 负责整理和草稿，工程师负责确认和提交。
