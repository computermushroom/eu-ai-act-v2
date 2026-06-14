# EU AI Act 合规平台 - 全面审计报告

> 审计日期：2026-06-14
> 审计范围：前端页面、API 路由、数据库调用、第三方服务集成
> 审计方法：静态代码分析 + 运行时逻辑审查

---

## 1. 幻觉代码清单

> 本章节列出所有"虚假/模拟/占位"代码，即表面上看起来功能完整，但实际并未执行真实业务逻辑的实现。

### 1.1 AI 助手（app/tools/ai-assistant/page.tsx）

- **状态**：完全虚假
- **问题描述**：`generateResponse` 函数使用硬编码的关键词匹配逻辑，而非调用真实的大语言模型（LLM）API。
- **代码表现**：
  - 输入包含 "risk" 返回预设的风险分类说明
  - 输入包含 "gdpr" 返回预设的 GDPR 说明
  - 其他情况返回通用免责声明
- **影响**：用户误以为获得了 AI 智能分析，实际只是字符串匹配。

### 1.2 Shadow AI 扫描器（lib/shadow-ai-scanner.ts）

- **状态**：明确模拟
- **问题描述**：文件顶部注释明确标注为 `// Simulated Shadow AI Scanner`，使用 `seedrandom` 生成伪随机结果。
- **代码表现**：
  - 基于输入字符串生成确定性"随机"分数
  - 返回模拟的检测到的工具列表（Slack AI、Grammarly 等）
  - 没有真实的网络扫描或端点检测能力
- **影响**：扫描结果是可预测的伪数据，不具备真实安全检测价值。

### 1.3 PDF 报告生成（修复前）

- **状态**：已修复
- **问题描述**：早期版本的 `/api/reports/pdf/download` 返回 HTML 内容而非真实 PDF。
- **当前状态**：已使用 `@react-pdf/renderer` 实现真正的服务端 PDF 生成，输出二进制 PDF 流。
- **文件**：`app/api/reports/pdf/download/route.tsx`

### 1.4 扫描任务（Scan Tasks）

- **状态**：部分虚假
- **问题描述**：`ScanTask` 模型和 CRUD API 完整存在，但：
  - 任务创建后**没有自动执行机制**（无 cron job、无队列消费者）
  - 任务状态停留在 `pending`，需要手动触发或外部调度
- **文件**：`app/api/scan-tasks/route.ts`
- **影响**：用户可创建扫描计划，但系统不会自动执行。

### 1.5 合规文档生成器（Compliance Generator）

- **状态**：模板化/占位
- **问题描述**：`app/api/compliance-generator/route.ts` 根据系统名称和行业参数，拼接预设的 JSON 模板文本。
- **代码表现**：
  - 所有章节内容均为预写好的说明文字，包含 `[placeholder]` 标记
  - 未进行真正的动态合规分析
  - 生成的文档需要用户手动填充大量内容
- **影响**：生成的是"模板框架"而非"智能分析报告"。

### 1.6 邮件服务（lib/email.ts）

- **状态**：部分可用（依赖配置）
- **问题描述**：当 SMTP 环境变量未配置时，邮件发送降级为 `console.log` 模拟。
- **代码表现**：
  - `SMTP_HOST` 未设置时，调用 `sendEmail` 只会在控制台打印邮件内容
  - 密码重置邮件可能无法送达真实邮箱
- **影响**：开发/测试环境可用，生产环境必须配置 SMTP 才能正常工作。

### 1.7 密码重置流程

- **状态**：部分可用
- **问题描述**：
  - 重置令牌生成和验证逻辑完全真实（使用 `VerificationToken` 模型）
  - 密码更新使用 bcrypt 哈希，安全正确
  - **但**：如果 SMTP 未配置，用户收不到重置邮件，重置链接无法传递
- **文件**：`app/api/auth/reset-password/route.ts`、`app/api/auth/reset-password/confirm/route.ts`

---

## 2. API 可用性报告

> 状态说明：
> - 真实可用：完整实现，有真实数据库操作和业务逻辑
> - 部分可用：有真实逻辑但存在外部依赖限制或模拟降级
> - 虚假：前端展示用，无真实后端支撑

| 路由 | 状态 | 订阅层级限制 | 备注 |
|------|------|-------------|------|
| `POST /api/auth/register` | 真实可用 | 无 | bcrypt 哈希、创建免费订阅、审计日志 |
| `GET/POST /api/auth/[...nextauth]` | 真实可用 | 无 | NextAuth v5，支持 Credentials + OAuth |
| `POST /api/auth/reset-password` | 部分可用 | 无 | 令牌生成真实，但邮件依赖 SMTP 配置 |
| `POST /api/auth/reset-password/confirm` | 真实可用 | 无 | 令牌验证、bcrypt 哈希、事务安全 |
| `GET/POST /api/ai-systems` | 真实可用 | 无 | 完整 CRUD，软删除 |
| `GET/PATCH/DELETE /api/ai-systems/[id]` | 真实可用 | 无 | 所有权验证、关联数据查询 |
| `GET/POST /api/documents` | 真实可用 | 无 | 版本自动递增、关联系统验证 |
| `GET/PATCH/DELETE /api/documents/[id]` | 真实可用 | 无 | 状态机验证（draft/review/approved/archived）|
| `GET/POST /api/alerts` | 真实可用 | 无 | 分页、标记已读、删除 |
| `GET/POST /api/training` | 真实可用 | 无 | 自动种子数据、进度追踪 |
| `GET/POST /api/audit` | 真实可用 | 无 | 分页审计日志查询 |
| `GET/PATCH /api/profile` | 真实可用 | 无 | 用户信息、订阅信息、更新名称 |
| `GET /api/dashboard` | 真实可用 | 无 | 聚合统计、最近活动 |
| `GET /api/health` | 真实可用 | 无 | 简单健康检查 |
| `GET /api/tools` | 真实可用 | 无 | 动态从 `trainingModule` 表读取，失败回退静态列表 |
| `POST /api/tools/data-governance` | 真实可用 | Professional+ | 创建 scanResult、更新系统状态 |
| `POST /api/tools/lifecycle` | 真实可用 | Business+ | 系统生命周期状态流转 |
| `POST /api/tools/specialized-checks` | 真实可用 | Professional+ | 多维度合规检查、创建 scanResult |
| `POST /api/tools/url-scan` | 真实可用 | 无 | 真实 HTTP 抓取 + 关键词匹配分析 |
| `POST /api/tools/shadow-ai` | 部分可用 | Business+ | 前端调用真实 API，但底层使用模拟扫描器 |
| `POST /api/tools/risk-assessment` | 真实可用 | 无 | 创建/更新 AI 系统、生成 scanResult |
| `POST /api/tools/prohibited-practices` | 真实可用 | Starter+ | 创建 scanResult、更新系统状态 |
| `POST /api/tools/transparency` | 真实可用 | Starter+ | 创建 scanResult、更新系统状态 |
| `GET/POST /api/fria` | 真实可用 | Professional+ | FRIA 评估 CRUD、关联 AI 系统 |
| `GET/POST /api/qms` | 真实可用 | Professional+ | QMS 清单 upsert、完成率计算 |
| `GET/POST /api/portal` | 真实可用 | Business+ | Client Portal CRUD、slug 唯一性验证 |
| `GET/POST /api/portal/clients` | 真实可用 | Business+ | 客户 CRUD、邮箱唯一性验证 |
| `GET/POST /api/team` | 真实可用 | Business+ | 团队成员邀请、角色管理、删除 |
| `GET/POST/PATCH/DELETE /api/webhooks` | 真实可用 | Business+ | Webhook 配置 CRUD、URL 验证 |
| `GET/POST /api/scan-tasks` | 部分可用 | 无 | CRUD 完整，但无自动执行机制 |
| `POST /api/reports/pdf` | 真实可用 | Professional+ | 生成报告数据结构、返回下载链接 |
| `GET /api/reports/pdf/download` | 真实可用 | Professional+ | 使用 `@react-pdf/renderer` 生成真实 PDF 二进制流 |
| `POST /api/subscription/checkout` | 真实可用 | 无 | 调用 Lemon Squeezy SDK 生成结账 URL |
| `POST /api/lemonsqueezy/webhook` | 真实可用 | 无 | HMAC-SHA256 签名验证、订阅状态同步 |
| `POST /api/i18n/set-locale` | 真实可用 | 无 | 设置 `NEXT_LOCALE` Cookie |
| `GET /api/i18n/set` | 真实可用 | 无 | HTML 页面重定向方式设置语言 |
| `GET /api/profile/export` | 真实可用 | 无 | GDPR 数据导出（JSON 附件）|
| `POST /api/profile/delete` | 真实可用 | 无 | GDPR 账户删除，软删除 + 数据匿名化 |
| `POST /api/compliance-generator` | 部分可用 | 按类型限制 | 返回模板化 JSON，非动态分析 |

---

## 3. 数据库映射报告

### 3.1 Prisma Schema 模型清单

| 模型名 | 表名映射 | 用途 |
|--------|---------|------|
| `User` | `users` | 用户账户 |
| `Account` | `accounts` | OAuth 账户关联 |
| `Session` | `sessions` | 数据库会话 |
| `VerificationToken` | `verification_tokens` | 密码重置/验证令牌 |
| `Subscription` | `subscriptions` | 订阅信息 |
| `AISystem` | `ai_systems` | AI 系统档案 |
| `ComplianceDocument` | `compliance_documents` | 合规文档 |
| `ScanResult` | `scan_results` | 扫描结果 |
| `ScanTask` | `scan_tasks` | 扫描任务计划 |
| `ComplianceAlert` | `compliance_alerts` | 合规提醒 |
| `FRIAAssessment` | `fria_assessments` | 基本权利影响评估 |
| `QMSChecklist` | `qms_checklists` | 质量管理系统清单 |
| `TrainingModule` | `training_modules` | 培训模块/工具定义 |
| `TrainingProgress` | `training_progress` | 用户培训进度 |
| `AuditLog` | `audit_logs` | 审计日志 |
| `TeamMember` | `team_members` | 团队成员 |
| `WebhookConfig` | `webhook_configs` | Webhook 配置 |
| `ClientPortal` | `client_portals` | 客户门户 |
| `Client` | `clients`（`@@map("client")`）| 客户信息 |
| `ClientAISystem` | `client_ai_systems` | 客户关联的 AI 系统 |
| `ClientDocument` | `client_documents` | 客户文档 |
| `ClientAlert` | `client_alerts` | 客户提醒 |

### 3.2 API 中的 Prisma 调用验证

通过对 `/app/api` 下所有 `prisma.xxx` 调用的静态分析，验证结果如下：

| Prisma 调用 | 对应模型 | 状态 |
|------------|---------|------|
| `prisma.user` | `User` | 匹配 |
| `prisma.account` | `Account` | 匹配 |
| `prisma.session` | `Session` | 匹配 |
| `prisma.verificationToken` | `VerificationToken` | 匹配 |
| `prisma.subscription` | `Subscription` | 匹配 |
| `prisma.aISystem` | `AISystem` | 匹配（Prisma 命名规范转换）|
| `prisma.complianceDocument` | `ComplianceDocument` | 匹配 |
| `prisma.scanResult` | `ScanResult` | 匹配 |
| `prisma.scanTask` | `ScanTask` | 匹配 |
| `prisma.complianceAlert` | `ComplianceAlert` | 匹配 |
| `prisma.fRIAAssessment` | `FRIAAssessment` | 匹配（Prisma 命名规范转换）|
| `prisma.qMSChecklist` | `QMSChecklist` | 匹配（Prisma 命名规范转换）|
| `prisma.trainingModule` | `TrainingModule` | 匹配 |
| `prisma.trainingProgress` | `TrainingProgress` | 匹配 |
| `prisma.auditLog` | `AuditLog` | 匹配 |
| `prisma.teamMember` | `TeamMember` | 匹配 |
| `prisma.webhookConfig` | `WebhookConfig` | 匹配 |
| `prisma.clientPortal` | `ClientPortal` | 匹配 |
| `prisma.client` | `Client` | 匹配（注意：`@@map("client")` 映射到 `client` 表）|
| `prisma.clientAISystem` | `ClientAISystem` | 匹配 |
| `prisma.clientDocument` | `ClientDocument` | 匹配 |
| `prisma.clientAlert` | `ClientAlert` | 匹配 |

**注意**：代码中不存在对未定义模型的 Prisma 调用。所有 `prisma.xxx` 均能在 schema 中找到对应模型。

---

## 4. 前端功能真实度报告

| 页面/功能 | 真实度 | 说明 |
|----------|--------|------|
| 注册页面 (`/register`) | 真实可用 | 真实表单，调用 `POST /api/auth/register`，bcrypt 哈希存储 |
| 登录页面 (`/login`) | 真实可用 | 真实表单，调用 `next-auth signIn`，支持 Credentials + OAuth |
| 定价页面 (`/pricing`) | 真实可用 | 展示计划，CheckoutButton 调用 `/api/subscription/checkout` 获取 Lemon Squeezy 结账链接 |
| AI 助手 (`/tools/ai-assistant`) | 完全虚假 | 硬编码关键词匹配，无真实 AI 调用 |
| 仪表盘 (`/dashboard`) | 真实可用 | 调用 `/api/dashboard` 获取真实聚合数据 |
| 工具页面（所有 `/tools/*`）| 真实可用 | 均调用对应 `/api/tools/*` API，数据来自数据库 |
| 合规生成器 (`/tools/compliance-generator`) | 模板化 | 调用真实 API，但返回预设模板 |
| 密码重置 (`/reset-password`) | 部分可用 | 前端表单真实，但邮件可达性依赖 SMTP |
| 个人资料 (`/profile`) | 真实可用 | 调用 `/api/profile` 获取/更新真实数据 |
| GDPR 导出 (`/profile/export`) | 真实可用 | 调用 `/api/profile/export` 下载 JSON |
| 团队管理 (`/team`) | 真实可用 | 调用 `/api/team` CRUD |
| 客户门户 (`/portal`) | 真实可用 | 调用 `/api/portal` 及子路由 |
| 报告下载 (`/reports`) | 真实可用 | 调用 `/api/reports/pdf/download` 获取真实 PDF |

---

## 5. 最终结论

### 5.1 100% 真实可用

以下功能具有完整的真实后端逻辑、数据库持久化和正确的业务规则：

- **认证体系**：注册、登录（Credentials + Google/GitHub OAuth）、登出、密码重置（令牌逻辑）
- **AI 系统管理**：创建、查询、更新、软删除、所有权验证
- **合规文档管理**：CRUD、版本自动递增、状态流转
- **扫描工具**：风险评估、禁止实践检查、透明度检查、URL 扫描（真实 HTTP 请求）、数据治理、专业检查、生命周期管理
- **FRIA 评估**：完整的评估 CRUD、关联 AI 系统
- **QMS 清单**：Upsert 操作、完成率计算
- **培训模块**：自动种子、进度追踪
- **审计日志**：全量记录、分页查询
- **仪表盘**：聚合统计、最近活动
- **订阅系统**：Lemon Squeezy 结账、Webhook 同步、层级管理
- **团队管理**：成员邀请、角色管理
- **客户门户**：Portal 和客户 CRUD
- **Webhook 配置**：CRUD、URL 验证
- **GDPR 功能**：数据导出（JSON）、账户删除（软删除 + 匿名化）
- **PDF 报告**：使用 `@react-pdf/renderer` 生成真实 PDF
- **国际化**：语言切换 Cookie 设置
- **健康检查**：简单存活检测

### 5.2 部分可用（有真实逻辑但有限制）

以下功能核心逻辑真实，但受外部依赖或设计限制：

- **邮件服务**：SMTP 未配置时降级为控制台打印；密码重置邮件可能无法送达
- **Shadow AI 扫描**：API 路由真实，但底层扫描器是模拟的（seedrandom）
- **扫描任务（Scan Tasks）**：CRUD 完整，但缺少自动执行机制（无 cron/队列）
- **合规文档生成器**：返回真实 JSON 响应，但内容是预设模板而非动态分析
- **密码重置完整流程**：令牌生成和验证真实，但邮件传递依赖 SMTP 配置

### 5.3 完全虚假/模拟

以下功能仅为前端展示或硬编码逻辑，无真实智能或自动化能力：

- **AI 助手**：硬编码关键词匹配，无 LLM 调用。用户输入 "risk" 得到固定回复，不具备自然语言理解能力。

---

## 附录：订阅层级守卫汇总

使用 `requireTier()` 守卫的路由：

| 路由 | 所需层级 |
|------|---------|
| `POST /api/tools/prohibited-practices` | `starter` |
| `POST /api/tools/transparency` | `starter` |
| `POST /api/tools/data-governance` | `professional` |
| `POST /api/tools/specialized-checks` | `professional` |
| `POST /api/tools/lifecycle` | `business` |
| `POST /api/tools/shadow-ai` | `business` |
| `POST /api/fria` | `professional` |
| `POST /api/qms` | `professional` |
| `POST /api/portal` | `business` |
| `POST /api/portal/clients` | `business` |
| `POST /api/team` | `business` |
| `POST /api/webhooks` | `business` |
| `POST /api/reports/pdf` | `professional` |
| `GET /api/reports/pdf/download` | `professional` |
| `POST /api/compliance-generator` | 按生成类型动态限制（free/starter/professional/business）|

---

*报告结束*
