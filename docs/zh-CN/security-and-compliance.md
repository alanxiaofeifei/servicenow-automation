# 安全与合规声明

## 设计原则

Automate drafting, not accountability.

工具可以辅助生成草稿字段、演示表单填充，但最终 review 和任何真实 ITSM 动作仍然由服务台工程师负责。

## P0 允许的范围

- 手动粘贴经过控制的问题上下文。
- 使用虚构或通用内容的 demo KB。
- deterministic MockAIProvider。
- Mock ServiceNow form。
- 填表前要求人工 review confirmation。

## P0 不允许的范围

- 自动提交。
- 自动关闭。
- 自动修改生产工单。
- 在源码中保存凭据。
- 把浏览器 cookies 或 session 提交到 Git。
- 把真实截图或真实 ticket 内容放进仓库。
- 把未脱敏客户内容发送给外部 AI。

## QA/dev test mode

只有在 mock workflow 稳定后，才可以加入 QA/dev 测试路径。测试必须基于授权访问、手动登录、被忽略的本地运行时目录，并且任何真实测试提交前都需要明确人工确认。

## Production shadow-mode

生产验证默认只能是 shadow-mode。可以把工具生成的草稿和人工处理结果做对比，但工具不能自动执行生产写入。

## Public showcase 规则

任何公开展示前，必须移除客户名、真实 URL、真实 assignment group、ticket number、截图、会议记录、录音和环境特定配置。
