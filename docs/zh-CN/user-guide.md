# ServiceNow Automation 使用指南

## 目的

ServiceNow Automation 帮助服务台工程师把零散的支持上下文整理成结构化、可编辑的 Incident 草稿。

v0.1.0-rc.1 版本包含：多渠道接入（Teams note、self-service、chat、shared mailbox、manual paste）、Source Review 提供 raw 和 cleaned 两种上下文字段、可编辑 TicketDraft 含字段映射、本地 demo KB 文章匹配与支持组推荐、Missing Info 和 Risk Flags、Risk Control Gate（stop-before-write）、Mock ServiceNow form、以及 Excel dry-run report（支持 CSV/Markdown 导出）。

## v0.1.0-rc.1 Demo 使用步骤

1. 打开桌面应用（demo mode ON，auto-submit disabled）。
2. 选择一个场景：
   - Load VPN Demo
   - Load Windows Demo
   - Load Mock Account Access Demo — no browser login
3. **Intake Source Review** — 查看 source type（Teams note、self-service 等），对比 raw 和 cleaned context。
4. **TicketDraft** — 查看并编辑生成字段：Short Description、Description、Work Notes、Category、Subcategory、Assignment Group、Impact、Urgency、Priority。
5. **KB Matching** — 查看匹配的知识文章、分数、关键词和支持组推荐。
6. 查看 Missing Info 和 Risk Flags。
7. 阅读 Risk Control Gate — 确认 stop-before-write。
8. 使用 Mock ServiceNow form 演示字段映射。
9. **Excel Dry-Run Report** — 预览报告行，可复制为 CSV 或 Markdown。
10. 不要把 Mock form 视为生产提交。Submit 在 demo mode 下禁用。

## 预期输出

工具应展示：

- Short Description
- Description
- Work Notes
- Category
- Subcategory
- Assignment Group
- Impact
- Urgency
- Priority
- KB Matches
- Missing Info questions
- Risk Flags
- Mock ServiceNow Incident form

## QA/dev 测试说明

未来 QA/dev mode 可以连接用户有权限的测试实例，但仍必须手动登录，并且任何真实测试提交前都必须由人工明确确认。

## Production shadow-mode 说明

如果未来做小范围生产验证，默认只能是 shadow-mode：把工具生成的草稿与人工操作进行对比。不能自动提交、自动关闭或自动修改生产记录。
