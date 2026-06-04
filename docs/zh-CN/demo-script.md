# 3–5 分钟演示脚本

## 1. 开场 (0:00–0:30)

服务台工程师每天要把零散的支持上下文整理成标准 ServiceNow 工单。这个 demo 展示的是一个 human-in-the-loop workbench：从多渠道接入复制的问题描述，转换成可编辑 Incident 草稿，匹配本地知识库文章，推荐支持组，生成 dry-run 报告，并填入安全的 Mock ServiceNow 表单。

## 2. 安全声明

这不是自动提交机器人。工具只自动化草稿整理，不转移责任。最终操作仍然必须由人工完成。

演示使用 **fake/sanitized 数据**。不要展示真实 ServiceNow 页面、真实工单、客户信息、browser endpoint、page fingerprint、cookie、session、HAR、trace、截图或录屏。

禁止：Save、Submit、Update、Resolve、Close、upload、email、bulk action 和任何 ServiceNow API write。

## 3. VPN 场景演示 (0:30–2:30)

1. 打开应用，显示 demo mode ON、Real ServiceNow OFF、auto-submit disabled。
2. 点击 **Load VPN Demo** — Intake Queue 显示默认 "Teams note: VPN connection issue after password reset" 条目，带有 source channel badge。
3. **Intake Source Review** — 指出 source type 选择器（Teams note / self-service / chat / shared mailbox / manual paste）。展示 raw vs cleaned context。
4. **TicketDraft** — 高亮生成字段：Short Description、Description、Work Notes、Category (Network)、Subcategory (VPN)、Assignment Group、Impact、Urgency、Priority。
5. **KB Match** — 展示 VPN 问题的知识库匹配结果，包含匹配分数和关键词。展示支持组推荐（"Demo Network Support — 95% confidence"）。
6. **Missing Info 和 Risk Flags** — 查看工具识别出的需确认项。
7. **Risk Control Gate** — 阅读 stop-before-write 确认。
8. **Mock ServiceNow Incident Preview** — 显示表单预览。指出 Submit / Save / Update / Close 在 demo mode 下禁用。
9. **Excel Dry-Run Report** — 展示包含 QA readiness 字段的 dry-run 行。演示 Copy CSV Row 和 Copy Markdown 按钮。
10. 手动编辑一个字段，证明服务台人员仍然掌控结果。

## 4. 快速展示其他场景 (2:30–3:00)

快速切换：

- **Windows Demo** — 相同流程，不同类别。
- **Mock Account Access Issue Demo** — 无需浏览器登录，展示不同 source channel。

说明同样的多渠道接入 → 草稿 → KB 匹配 → 报告流程可以覆盖常见服务台 triage 场景。

## 5. 业务价值 (3:00–3:30)

这个工具的价值是减少重复写工单的时间，提高字段选择和 work notes 的一致性，内置 KB 匹配和路由建议，提供 dry-run 报告证据，让升级交接更安全——同时始终保持人工最终提交。

## 6. 面试收尾句

This project demonstrates how I combine real service desk workflow understanding with practical AI-assisted automation design while respecting ITSM control boundaries. 完整源代码、文档和演示包均可在仓库中找到。
