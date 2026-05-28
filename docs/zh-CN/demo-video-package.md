# 功能介绍与演示视频制作包

## 目标

制作一个 3-5 分钟的安全演示视频，说明 ServiceNow Automation 的价值、操作流程和 no-write 安全边界。

演示视频只使用 mock / synthetic 内容，不展示真实 ServiceNow 页面或客户数据。

## 视频定位

目标观众：

- 招聘方 / 面试官
- 内部评审人员
- 项目协作者
- 需要快速理解产品价值的人

核心信息：

> 这个工具不是自动提交机器人，而是一个帮助服务台工程师更快、更一致、更安全地准备 Incident 草稿的本地桌面工作台。

## 建议时长

- 30 秒：口播短介绍
- 3-5 分钟：完整 walkthrough
- 8-10 分钟：技术安全版，可单独录给 reviewer

## 3-5 分钟主视频结构

### 0:00-0:20 开场：问题背景

画面：桌面应用首页或 mock workbench。

旁白：

> 服务台工程师每天都要把聊天、邮件或电话里的零散信息整理成标准工单。重复填写字段、组织 work notes、判断缺失信息，既耗时又容易不一致。

### 0:20-0:45 产品定位

画面：展示 Captured Context、TicketDraft、KB Matches 三个区域。

旁白：

> ServiceNow Automation 是一个 human-in-the-loop 桌面工作台。它把人工提供的上下文整理成可编辑的 Incident 草稿，并把知识库匹配、缺失信息和风险提示放在同一屏里。

### 0:45-1:20 安全声明

画面：展示 Risk Control Gate 或安全说明。

旁白：

> 这个项目最重要的边界是 no-write。AI 不自动 Save、Submit、Update、Resolve 或 Close，也不上传附件、不发邮件、不做 ServiceNow API 写入。它只帮助准备草稿，最终判断和操作仍由人工完成。

### 1:20-2:20 Demo 场景

画面：点击 Load VPN Demo 或其他 mock 场景。

操作：

1. 加载 demo 场景。
2. 展示 Captured Context。
3. 展示 TicketDraft。
4. 指出 Short Description、Description、Work Notes。
5. 展示 KB Matches 和 Missing Info。
6. 手动编辑一个字段，强调操作者可控。

旁白：

> 这里使用的是 mock 场景，不包含真实客户或真实工单数据。工具会生成一份可编辑草稿，并提示哪些信息还需要人工确认。

### 2:20-3:10 Mock 表单映射

画面：Mock ServiceNow Incident form。

旁白：

> 在演示模式里，我们只展示字段如何映射到 mock 表单。这个表单不连接真实 ServiceNow，也不会产生真实提交。

### 3:10-3:45 Windows 启动故事

画面：可以展示 launcher 文档、dry-run 命令输出或本地启动画面。

旁白：

> Windows 端的目标是让操作者通过双击 launcher 启动本地桌面工作台，并通过 WSL helper 做依赖检查和启动日志定位。这个阶段验证的是本地 readiness，不是授权真实浏览器操作。

### 3:45-4:20 当前状态和路线图

画面：release plan 或 issue list 的脱敏截图。

旁白：

> 当前版本正在准备 Windows v0.1 release candidate。下一步是完成 launcher 验收、打包 release asset，并继续保持 no-write 和 privacy scan 作为发布门槛。

### 4:20-4:40 收尾

旁白：

> 这个项目展示的是安全边界内的 AI-assisted service desk workflow：AI 帮助整理和检查，人保留最终控制权。

## 30 秒短介绍

> ServiceNow Automation 是一个服务台工程师的本地 AI 工作台。它把零散支持上下文整理成可编辑的 Incident 草稿，显示知识库匹配、缺失信息和风险提示，并保持严格 no-write 边界：不自动 Save、Submit、Update、Resolve 或 Close。当前版本聚焦 Windows 本地启动、mock demo 和 release candidate 准备，适合展示 AI 如何在 ITSM 控制边界内提升服务台效率。

## 录制前检查表

- 使用浅色暖色主题，字体放大到 125%-150%，使用大号光标，旁白放慢，避免录入过小的终端文字。
- 使用 mock 或 synthetic demo 数据。
- 关闭任何真实 ServiceNow 页面。
- 不展示浏览器地址栏中的真实业务域名。
- 不展示 ticket ID、sys_id、requester、assigned user、assignment group。
- 不展示 cookies、sessions、storage-state、HAR、trace、screenshots 或 raw logs。
- 不演示 Save / Submit / Update / Resolve / Close。
- 如果展示 Windows launcher，只展示本地路径结构或脱敏命令，不展示个人目录。
- 录制结束后复看全片，确认没有敏感信息。

## 发布前检查表

- 文案中不宣称“自动提交”或“无人值守处理”。
- 文案中不暗示可以绕过人工审批。
- 视频标题和简介强调 human-in-the-loop / no-write。
- 如果发布到作品集，只使用 public-safe 素材。
- 如果用于面试，可以准备一个技术补充版本解释 safety gate、fingerprint block 和 privacy scan。

## 建议文件名

- `servicenow-automation-overview-30s.mp4`
- `servicenow-automation-demo-3min.mp4`
- `servicenow-automation-safety-walkthrough-8min.mp4`
