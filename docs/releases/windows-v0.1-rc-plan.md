# Windows v0.1 RC 发布计划

## 结论

完整 Windows 端软件不应直接从当前 Draft PR 发布。正确顺序是：

1. 先合并 Windows launcher/runtime slice。
2. 再完成 Windows about:blank / launcher readiness 手动验收。
3. 再做单独 packaging PR。
4. 最后创建 GitHub Draft Release 或 prerelease。

## v0.1 RC 的定义

v0.1 RC 是一个 Windows operator readiness release candidate，包含：

- Electron desktop app build
- Windows double-click launcher
- WSL startup helper
- WSL repair helper
- dedicated browser runtime helper
- sanitized quickstart
- release notes
- checksum file

v0.1 RC 不包含：

- 自动登录
- live ServiceNow execution
- Save / Submit / Update / Resolve / Close
- upload / email / bulk action
- ServiceNow API write
- 生产或 production-shadow 写入
- 真实业务截图、HAR、trace、录屏或 session artifact

## Gate 0: PR #117

目标：合并 Windows launcher/runtime 最小安全切片。

通过标准：

- PR clean
- typecheck / tests / privacy scan 已通过
- 没有 live ServiceNow 操作
- 没有 raw URL、cookie、session、HAR、trace 或截图

## Gate 1: Windows 手动验收

目标：验证本地启动路径，而不是验证真实 ServiceNow 操作。

允许：

- WSL dry-run
- Windows launcher 启动桌面应用或输出启动日志路径
- dedicated browser helper 使用 `about:blank`
- 验证 CDP 默认 loopback-only

禁止：

- 真实 QA 登录
- 真实 Incident 页面交互
- 自动填字段
- 保存、提交、更新、Resolve、关闭

## Gate 2: Packaging PR

目标：实现可重复的 Windows release artifact。

建议先做 portable zip，不先做复杂 installer。

交付物：

- packaging command
- release staging directory
- SHA256 checksums
- sanitized release notes
- install/start/repair guide
- uninstall/cleanup note

## Gate 3: GitHub Draft Release

目标：创建 Draft Release 或 prerelease，供 Alan 最终检查。

发布前必须确认：

- release asset 来自 clean source
- privacy scan 通过
- checksums 已生成
- release notes 没有真实 ServiceNow/customer 内容
- artifact 不包含 `.local/`、logs、cookies、sessions、HAR、trace、screenshots、recordings、personal paths 或 credentials

## 推荐时间点

如果 PR #117 被接受：

- 当天：合并 #117，执行 Windows launcher/readiness 手动验收。
- 同一天或下一个工作块：开发 packaging PR。
- packaging PR 通过后：创建 GitHub Draft Release / prerelease。
- Alan 复核 release asset 和 demo material 后：再决定是否 publish。

## 推荐 release 命名

- tag: `v0.1.0-rc.1`
- release title: `ServiceNow Automation v0.1.0-rc.1 Windows Operator Preview`
- release type: prerelease
- asset example:
  - `servicenow-automation-windows-v0.1.0-rc.1.zip`
  - `servicenow-automation-windows-v0.1.0-rc.1.sha256`

## Release note 草稿

```text
ServiceNow Automation v0.1.0-rc.1 is a Windows Operator Preview focused on local desktop startup, WSL helper readiness, dedicated runtime setup, and safe mock-demo workflows.

This prerelease does not approve live ServiceNow operation. It does not perform Save, Submit, Update, Resolve, Close, upload, email, bulk action, ServiceNow API write, production write, or production-shadow write.
```
