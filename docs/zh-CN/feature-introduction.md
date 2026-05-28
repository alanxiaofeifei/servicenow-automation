# ServiceNow Automation 功能介绍

## 一句话定位

ServiceNow Automation 是一个面向服务台工程师的本地桌面工作台：把人工提供的支持上下文整理成可编辑的 Incident 草稿，并用明确的安全边界帮助操作者完成后续人工处理。

它不是自动提交机器人，也不是无人值守的 ServiceNow 代理。

## 适合展示的核心价值

- 减少重复整理工单的时间。
- 让 Short Description、Description、Work Notes 等文本更稳定。
- 让 Category、Subcategory、Impact、Urgency、Priority 等字段选择更可检查。
- 把缺失信息、风险提示、知识库匹配放在同一个工作台中。
- 保持 human-in-the-loop：AI 负责草稿和检查，人负责判断和最终操作。

## 当前可展示能力

### 1. 本地场景加载

桌面应用内置安全的 demo 场景，可用于展示常见服务台工作流：

- VPN 连接问题
- Windows 终端问题
- Mock account access issue（不演示浏览器登录）

这些场景使用 mock 或 synthetic 内容，不需要真实 ServiceNow 数据。

### 2. Incident 草稿生成

工具会把输入上下文整理成结构化草稿，包括：

- Short Description
- Description
- Work Notes
- Category / Subcategory
- Assignment Group 建议
- Impact / Urgency / Priority
- Missing Info questions
- Risk Flags

草稿是可编辑的；操作者可以逐项修改。

### 3. 本地知识库匹配

工作台可以显示本地 demo KB matches，帮助说明为什么某些排查建议或字段建议被选中。

### 4. 风险控制提示

Risk Control Gate 会提醒操作者：当前输出只是草稿，不能等同于真实提交。任何真实环境动作都必须由人工确认。

### 5. Mock ServiceNow 表单演示

演示时可以使用 Mock ServiceNow Incident form 说明字段映射，但这个 mock form 不代表真实写入能力。

### 6. Windows 启动路径

Windows 端目标是让操作者通过双击 launcher 启动桌面工作台，并通过 WSL helper 完成依赖检查、构建检查和启动日志定位。

这个路径只证明本地启动和 readiness，不授权真实 ServiceNow 操作。

## 明确不做什么

当前展示和 release candidate 不允许：

- 自动登录
- 自动提交
- Save / Submit / Update / Resolve / Close
- upload / email / bulk action
- ServiceNow API write
- 生产或 production-shadow 写入
- 真实 ServiceNow 截图、HAR、trace、录屏
- cookies、sessions、storage-state 导出
- 将真实客户、工单、请求人、分派组、页面指纹或浏览器 endpoint 暴露给外部 AI

## 推荐对外讲法

可以这样介绍：

> 这是一个为服务台工程师设计的安全 AI 工作台。它把零散上下文整理成可编辑的 Incident 草稿，并把知识库匹配、缺失信息和风险提示集中在一个界面里。系统刻意保持 no-write 边界：AI 不替人点击 Save、Submit、Update、Resolve 或 Close，最终操作仍由人工完成。

## 当前阶段

当前项目处于 Windows operator readiness 和 release candidate 准备阶段。

- PR #117：Windows launcher / WSL helper / dedicated runtime helper 的最小安全切片。
- Issue #118：Windows v0.1 RC packaging 和 Draft GitHub Release。
- Issue #119：功能介绍文档和脱敏演示视频包。

## 后续路线

1. 先完成 Windows launcher/readiness 验收。
2. 再生成 Windows v0.1 release candidate。
3. 再制作功能介绍文档和安全 demo 视频。
4. 真正 QA 或 production-shadow 前必须另开 checkpoint，不能从 demo/release 自动跳到真实操作。
