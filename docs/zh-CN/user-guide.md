# ServiceNow Automation 使用指南

## 目的

ServiceNow Automation 帮助服务台工程师把零散的支持上下文整理成结构化、可编辑的 Incident 草稿。

P0 版本刻意保持简单稳定：Manual Paste、本地 demo KB、deterministic MockAIProvider、Mock ServiceNow form。

## P0 Demo 使用步骤

1. 打开桌面应用。
2. 选择一个场景：
   - Load VPN Demo
   - Load Windows Demo
   - Load Mock Account Access Demo — no browser login
3. 查看 Captured Context。
4. 查看并编辑 TicketDraft 字段。
5. 查看 KB Matches、Missing Info、Risk Flags。
6. 阅读 Risk Control Gate。
7. 在填表前确认已经人工 review。
8. 使用 Mock ServiceNow form 演示字段映射。
9. 不要把 Mock form 视为生产提交。

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
