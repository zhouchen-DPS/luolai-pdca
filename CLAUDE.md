# 罗莱 PDCA 项目 — Claude 工作指南

## 项目基本信息

- **项目名称：** 罗莱生活 PDCA 销售管理系统
- **路径：** `C:\Users\zhouchen\luolai-pdca`
- **技术栈：** Next.js 14 (App Router) + TypeScript + Prisma + PostgreSQL + NextAuth + 飞书 OAuth + Claude API + 阿里云 OSS
- **部署：** Vercel

## 当前开发阶段

一期实现计划执行中，任务进度见 `docs/superpowers/plans/2026-04-01-phase1-core.md`

- ✅ Task 1：项目初始化
- ✅ Task 2：Prisma Schema + 数据库
- ✅ Task 3：飞书 OAuth + NextAuth
- ✅ Task 4：飞书组织架构同步
- ✅ Task 5：状态计算引擎
- ✅ Task 6：目标管理 API
- ✅ Task 7：日报填报 API
- ✅ Task 8：排行榜 API
- ✅ Task 9：AI 周复盘 API
- ✅ Task 10：经验推送 API
- ✅ Task 11：Cron 定时任务
- ✅ Task 12：前端页面
- ✅ Task 13：部署配置

## 代码规范

- 所有文件用 TypeScript，路径别名用 `@/`
- API Routes 放在 `app/api/` 下，遵循 Next.js 14 App Router 规范
- 数据库操作通过 `lib/prisma.ts` 单例访问
- 测试文件放在 `tests/` 目录，文件名 `*.test.ts`

## 关键业务规则（PRD v2.1 核心决策）

### 状态判定
- **只有两档：** 绿（完成率 ≥ 100%）/ 红（< 100%），无黄色中间态

### 日报
- 19:00 飞书提醒，20:00 截止；逾期督导收汇总通知
- 未达成时，未达成原因**强制必填**；达成时成功总结选填
- **不允许**补填历史日期

### 排行榜
- 周一至周日为一周
- 完成率相同时，销售额绝对值破平
- 月中新入职不参与当月排名

### 目标
- 可超发，不可少发；门店→店员目标**严格等额**
- 一期督导自设月度目标，无需上级下发

### 权限（一期3种）
- **督导：** 管辖范围全量操作
- **店员：** 个人数据 + 全国 TOP10 + 填写日报
- **系统管理员：** 组织同步、经验推送管理

## 设计规范（方案三·纯白+勃艮第酒红）

| Token | 值 |
|-------|----|
| 主背景 | `#FFFFFF` |
| 边栏背景 | `#F0EBE3` |
| 主色 | `#6B2D3E`（勃艮第酒红） |
| 主文字 | `#1A1714` |

字体：Noto Serif SC（标题）/ Noto Sans SC（正文）/ DM Mono（数字）/ Cormorant Garamond italic（英文装饰）

布局：PC 左侧固定边栏 220px；手机底部 Tab 栏

设计稿：`.superpowers/brainstorm/938-1774508493/content/`

## 关键文件

| 文件 | 说明 |
|------|------|
| `PRD.md` | PRD v2.1（58条 User Story） |
| `CONTEXT.md` | 项目背景上下文 |
| `docs/superpowers/plans/2026-04-01-phase1-core.md` | 一期完整实现计划 |
| `.env.local.example` | 所有环境变量模板 |
| `prisma/schema.prisma` | 数据库模型（Task 2 创建） |
