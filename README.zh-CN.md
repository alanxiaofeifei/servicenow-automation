# ServiceNow Automation — 中文说明

ServiceNow Automation 是一个面向服务台工程师的 **human-in-the-loop ServiceNow Automation Workbench** 原型项目。

它的目标不是替代人工处理工单，而是把零散的支持上下文整理成标准 Incident 草稿、匹配本地知识库、生成可编辑字段，并填入安全的 Mock ServiceNow 表单。最终判断和提交仍然由人工完成。

## 它能做什么

- 接收手动粘贴的故障描述，保证 P0 流程稳定可演示。
- 把输入整理成 `CapturedContext`。
- 使用 deterministic `MockAIProvider` 生成结构化 `TicketDraft`。
- 匹配本地 demo KB：VPN、Windows endpoint、账号/登录。
- 展示并允许编辑 Short Description、Description、Work Notes、Category、Subcategory、Assignment Group、Impact、Urgency、Priority。
- 填入 **Mock** ServiceNow Incident 表单，用于 Demo 和 QA/dev rehearsal。
- 在填表前显示明显的风险控制和人工确认门。

## 它不做什么

- 不自动提交工单。
- 不自动关闭工单。
- 不自动修改生产 ServiceNow 记录。
- 不把密码、浏览器 cookie、真实 ticket 内容提交到 Git。
- 不把未脱敏的客户数据发送给外部 AI provider。

## 三个演示场景

1. VPN 在密码或 MFA 变化后无法连接。
2. Windows endpoint 在更新后变慢。
3. 账号或登录问题需要访问排障。

每个场景都遵循：

```text
Manual Paste
→ CapturedContext
→ MockAIProvider
→ TicketDraft
→ KB Matches
→ Human Review
→ Mock ServiceNow Incident Form
→ 最终提交只允许人工完成
```

## 文档入口

- 中文使用指南：`docs/zh-CN/user-guide.md`
- 英文使用指南：`docs/en-US/user-guide.md`
- 中文演示脚本：`docs/zh-CN/demo-script.md`
- 英文演示脚本：`docs/en-US/demo-script.md`
- 中文安全声明：`docs/zh-CN/security-and-compliance.md`
- 英文安全声明：`docs/en-US/security-and-compliance.md`
