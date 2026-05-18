# Service Now Automation 中文说明

这是一个从零重建的 ServiceNow 服务台自动化工作台项目。它不是旧 SD 工具的源码修补项目，而是把旧工具文档中验证过的服务台流程，重新设计成一个更通用、更安全、更适合作品展示的 MVP。

## 一句话定位

**把 Teams、邮件、ServiceNow Chat 或手动输入里的故障信息，整理成可编辑、可审计、可人工确认的 ServiceNow Incident 草稿。**

## 核心原则

1. AI 只生成草稿，不直接提交或关闭工单。
2. 所有 ServiceNow 写入动作前必须人工确认。
3. Demo 使用脱敏/虚构数据，不使用真实客户截图、邮箱、工单号或知识库原文。
4. P0 先做稳定闭环：手动输入 → KB 匹配 → TicketDraft → Mock ServiceNow 表单填充。
5. P1/P2 再扩展 Teams Web、Outlook Web、真实 ServiceNow Web Fill、SQLite、Graph/API 等能力。

## 6 月 5 日前验收标准

能连续演示 3 个场景：VPN、Windows 性能问题、账号/登录问题。

每个场景必须展示：

```text
输入问题
→ 提取问题和字段
→ 匹配本地 KB
→ 生成 Short Description / Description / Work Notes / Resolution Notes / Category 等字段
→ 人工编辑确认
→ 填入 Mock ServiceNow 表单
→ Submit 保持人工/禁用/演示状态
```

