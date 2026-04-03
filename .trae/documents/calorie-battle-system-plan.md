# "卡路里大作战" 校园健身活动管理系统 - 实施方案

## 一、项目概述

### 1.1 项目背景

"卡路里大作战"是一个校园健身活动管理系统，活动周期为31天（3.30 - 4.30），包含三大板块：日常运动打卡、运动打卡积分兑换、特色课程互动。系统需支持三种用户角色（普通用户、审核员、管理员），实现打卡提交与审核、积分管理、积分兑换、实时排行榜、轻盈计划（体重追踪）、健身掠影投票等核心功能。

### 1.2 技术栈决策

| 层级 | 技术选型 | 理由 |
|------|---------|------|
| 前端框架 | React 18 + TypeScript | 类型安全、生态成熟、组件化开发 |
| PC端UI | Ant Design 5 | 企业级组件库，表格/表单能力强，适合管理后台 |
| 移动端UI | Ant Design Mobile 5 | 与PC端风格统一，移动端体验好 |
| 状态管理 | Zustand | 轻量、API简洁、TypeScript友好 |
| 请求库 | Axios + React Query (TanStack Query) | 缓存管理、自动重试、请求去重 |
| 路由 | React Router v6 | 嵌套路由、路由守卫支持 |
| 后端框架 | Express.js | 轻量灵活、中间件生态丰富 |
| ORM | Sequelize | 适合复杂关联关系，Model关联查询方便 |
| 数据库 | MySQL 8.0 | 事务支持、JSON字段、窗口函数 |
| 认证 | JWT (Access + Refresh Token) | 无状态、适合多角色权限控制 |
| 文件存储 | 本地磁盘 | 校园内网部署，本地存储更简单 |
| 定时任务 | node-cron | 积分过期自动清零 |
| Excel导出 | exceljs | 服务端生成Excel |

### 1.3 PC/移动端适配策略

**决策：单一代码库 + 响应式布局组件分离**

- 使用自定义 `useResponsive` Hook 基于 `window.matchMedia` 检测设备类型，断点设置为 `768px`
- 路由层根据设备类型动态加载对应的 Layout 组件（`PcLayout` / `MobileLayout`）
- 共享所有业务组件（表单、表格逻辑）、API调用层、状态管理层
- 仅在展示层分离：PC端使用 Ant Design 的 `Table`/`Form`，移动端使用 Ant Design Mobile 的 `List`/`Form`
- 目录结构中每个页面模块包含 `index.tsx`（共享逻辑）、`PcView.tsx`、`MobileView.tsx`

---

## 二、系统架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────┐
│                    客户端 (React)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │  PcLayout    │  │ MobileLayout │  │  Shared   │  │
│  │  (Ant Design)│  │ (Ant Mobile) │  │ Components│  │
│  └──────┬───────┘  └──────┬───────┘  └─────┬─────┘  │
│         └────────┬────────┘                 │        │
│              ┌────┴────┐              ┌────┴────┐    │
│              │  Hooks  │              │Services │    │
│              │(状态/响应)│              │ (API层) │    │
│              └────┬────┘              └────┬────┘    │
└───────────────────┼───────────────────────┼─────────┘
                    │    Axios / React Query
┌───────────────────┼───────────────────────┼─────────┐
│              ┌────┴───────────────────────┴────┐     │
│              │         Nginx 反向代理           │     │
│              └────────────┬───────────────────┘     │
│                    服务端 (Express.js)              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────┐ │
│  │Middleware│ │  Routes  │ │Controller│ │Service│ │
│  │(Auth/Log │ │ (路由层) │ │ (控制层) │ │(业务层)│ │
│  │ /RateLim)│ │          │ │          │ │       │ │
│  └──────────┘ └──────────┘ └──────────┘ └──┬────┘ │
│                                          ┌──┴────┐ │
│                                    ┌─────┤ Model │ │
│                                    │     │(数据层)│ │
│                              ┌─────┤     └───────┘ │
│                              │     │               │
│                        ┌─────┴──┐ ┌┴──────┐       │
│                        │ MySQL  │ │文件存储│       │
│                        └────────┘ └───────┘       │
└─────────────────────────────────────────────────────┘
```

### 2.2 前端项目结构

```
calorie-battle-web/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── app/                          # 应用入口与全局配置
│   │   ├── App.tsx                   # 根组件
│   │   ├── router.tsx                # 路由配置
│   │   └── store/                    # Zustand 全局状态
│   │       ├── authStore.ts          # 认证状态
│   │       └── appStore.ts           # 应用全局状态
│   ├── assets/                       # 静态资源
│   │   ├── images/
│   │   └── styles/
│   │       ├── global.css
│   │       ├── pc-variables.css      # PC端CSS变量
│   │       └── mobile-variables.css  # 移动端CSS变量
│   ├── components/                   # 共享通用组件
│   │   ├── common/
│   │   │   ├── ImageUpload/          # 图片上传组件
│   │   │   ├── StatusBadge/          # 审核状态标签
│   │   │   ├── ConfirmDialog/        # 二次确认弹窗
│   │   │   ├── LoadingSpinner/
│   │   │   └── EmptyState/
│   │   ├── business/
│   │   │   ├── PointCard/            # 积分卡片
│   │   │   ├── RankingList/          # 排行榜组件
│   │   │   ├── CheckinForm/          # 打卡表单（共享逻辑）
│   │   │   ├── ReviewCard/           # 审核卡片
│   │   │   ├── RedemptionItem/       # 兑换商品项
│   │   │   └── VoteCard/             # 投票卡片
│   │   └── layout/
│   │       ├── PcLayout/             # PC端布局框架
│   │       │   ├── index.tsx
│   │       │   ├── Header.tsx
│   │       │   ├── Sidebar.tsx
│   │       │   └── Footer.tsx
│   │       └── MobileLayout/         # 移动端布局框架
│   │           ├── index.tsx
│   │           ├── TabBar.tsx
│   │           └── Header.tsx
│   ├── hooks/                        # 自定义Hooks
│   │   ├── useResponsive.ts          # 设备检测Hook
│   │   ├── useAuth.ts                # 认证Hook
│   │   ├── useCheckin.ts             # 打卡业务Hook
│   │   ├── usePoints.ts              # 积分业务Hook
│   │   └── usePagination.ts          # 分页Hook
│   ├── pages/                        # 页面模块（按角色+功能组织）
│   │   ├── auth/                     # 认证相关页面
│   │   │   ├── Login/
│   │   │   ├── Register/
│   │   │   └── ResetPassword/
│   │   ├── user/                     # 普通用户页面
│   │   │   ├── Home/                 # 用户首页
│   │   │   ├── Checkin/              # 打卡提交
│   │   │   ├── ReviewProgress/       # 审核进度
│   │   │   ├── Points/               # 积分管理
│   │   │   ├── Redemption/           # 积分兑换
│   │   │   ├── Ranking/              # 排行榜
│   │   │   ├── WeightPlan/           # 轻盈计划
│   │   │   └── PhotoVoting/          # 健身掠影投票
│   │   ├── reviewer/                 # 审核员页面
│   │   │   ├── Home/                 # 审核员首页
│   │   │   ├── PendingReview/        # 待审核列表
│   │   │   └── ReviewHistory/        # 审核记录
│   │   └── admin/                    # 管理员页面
│   │       ├── Dashboard/            # 数据概览
│   │       ├── ReviewManage/         # 全量审核管理
│   │       ├── WeightPlanReview/     # 轻盈计划审核
│   │       ├── ReviewerManage/       # 审核员管理
│   │       ├── TaskManage/           # 任务与分值管理
│   │       ├── ActivityManage/       # 活动与兑换管理
│   │       ├── PhotoManage/          # 投稿与投票管理
│   │       ├── RedemptionManage/     # 兑换核销管理
│   │       └── SystemManage/         # 系统管理
│   ├── services/                     # API服务层
│   │   ├── api.ts                    # Axios实例配置
│   │   ├── authApi.ts
│   │   ├── checkinApi.ts
│   │   ├── pointsApi.ts
│   │   ├── reviewApi.ts
│   │   ├── rankingApi.ts
│   │   ├── redemptionApi.ts
│   │   ├── weightPlanApi.ts
│   │   ├── photoApi.ts
│   │   ├── adminApi.ts
│   │   └── systemApi.ts
│   ├── utils/                        # 工具函数
│   │   ├── format.ts
│   │   ├── validate.ts
│   │   ├── constants.ts
│   │   └── device.ts
│   └── types/                        # TypeScript类型定义
│       ├── auth.types.ts
│       ├── checkin.types.ts
│       ├── points.types.ts
│       ├── review.types.ts
│       ├── user.types.ts
│       └── api.types.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .env
```

### 2.3 后端项目结构

```
calorie-battle-server/
├── src/
│   ├── app.js                        # Express应用入口
│   ├── config/
│   │   ├── index.js                  # 配置汇总
│   │   ├── database.js               # 数据库配置
│   │   ├── jwt.js                    # JWT配置
│   │   └── upload.js                 # 文件上传配置
│   ├── middleware/                   # 中间件
│   │   ├── auth.js                   # JWT认证中间件
│   │   ├── rbac.js                   # 角色权限控制中间件
│   │   ├── rateLimiter.js            # 请求频率限制
│   │   ├── validator.js              # 请求参数校验
│   │   ├── auditLogger.js            # 操作审计日志
│   │   ├── errorhandler.js           # 全局错误处理
│   │   └── sensitiveFilter.js        # 敏感词过滤
│   ├── routes/                       # 路由层
│   │   ├── index.js
│   │   ├── auth.routes.js
│   │   ├── checkin.routes.js
│   │   ├── review.routes.js
│   │   ├── points.routes.js
│   │   ├── ranking.routes.js
│   │   ├── redemption.routes.js
│   │   ├── weightPlan.routes.js
│   │   ├── photo.routes.js
│   │   ├── admin.routes.js
│   │   └── system.routes.js
│   ├── controllers/                  # 控制器层
│   │   ├── auth.controller.js
│   │   ├── checkin.controller.js
│   │   ├── review.controller.js
│   │   ├── points.controller.js
│   │   ├── ranking.controller.js
│   │   ├── redemption.controller.js
│   │   ├── weightPlan.controller.js
│   │   ├── photo.controller.js
│   │   ├── admin.controller.js
│   │   └── system.controller.js
│   ├── services/                     # 业务逻辑层
│   │   ├── auth.service.js
│   │   ├── checkin.service.js
│   │   ├── review.service.js
│   │   ├── points.service.js
│   │   ├── ranking.service.js
│   │   ├── redemption.service.js
│   │   ├── weightPlan.service.js
│   │   ├── photo.service.js
│   │   ├── admin.service.js
│   │   ├── export.service.js
│   │   └── notification.service.js
│   ├── models/                       # 数据模型层 (Sequelize)
│   │   ├── index.js
│   │   ├── User.js
│   │   ├── Task.js
│   │   ├── Checkin.js
│   │   ├── Review.js
│   │   ├── PointLog.js
│   │   ├── Redemption.js
│   │   ├── RedemptionItem.js
│   │   ├── WeightRecord.js
│   │   ├── PhotoWork.js
│   │   ├── Vote.js
│   │   ├── Activity.js
│   │   ├── AuditLog.js
│   │   └── SystemConfig.js
│   ├── utils/
│   │   ├── password.js               # 密码加密(bcrypt)
│   │   ├── jwt.js                    # JWT工具
│   │   ├── response.js               # 统一响应格式
│   │   ├── pagination.js             # 分页工具
│   │   ├── date.js
│   │   └── export.js                 # Excel导出工具
│   ├── validators/
│   │   ├── auth.validator.js
│   │   ├── checkin.validator.js
│   │   └── admin.validator.js
│   ├── jobs/                         # 定时任务
│   │   ├── index.js
│   │   ├── pointExpiry.js
│   │   └── dbBackup.js
│   └── seeders/                      # 数据初始化
│       ├── initTasks.js
│       ├── initItems.js
│       └── initAdmin.js
├── uploads/
│   ├── checkin/
│   ├── weight/
│   └── photo/
├── package.json
├── .env
└── ecosystem.config.js
```

---

## 三、数据库设计

### 3.1 ER关系概览

```
User ──< Checkin >── Task
User ──< PointLog
User ──< Redemption >── RedemptionItem
User ──< WeightRecord
User ──< PhotoWork >──< Vote
User ──< AuditLog
Activity (活动配置)
SystemConfig (系统配置)
SensitiveWord (敏感词)
Announcement (公告轮播图)
```

### 3.2 核心表结构

#### users (用户表)
- id, account(唯一), username(唯一), password_hash, role(user/reviewer/admin), avatar
- status(active/locked/disabled), login_fail_count, locked_until
- total_points, total_earned, total_used, first_earned_at(排行榜同分排序用)
- created_at, updated_at

#### tasks (活动任务表)
- id, category, name, description, points, submit_rules(JSON), required_fields(JSON)
- start_time, end_time, is_active, sort_order
- created_at, updated_at

#### checkins (打卡提交表)
- id, user_id, task_id, submit_data(JSON), images(JSON)
- status(pending/approved/rejected), reject_reason
- reviewed_by, reviewed_at, points_awarded
- created_at, updated_at

#### weight_records (轻盈计划体重记录表)
- id, user_id, record_type(initial/final), screenshot_url
- weight(DECIMAL, 仅管理员填写), body_fat(DECIMAL, 仅管理员填写)
- status(pending/approved/rejected), reject_reason
- reviewed_by(必须为管理员), reviewed_at
- **关键**: weight/body_fat 默认NULL，用户端仅 status=approved 时返回

#### point_logs (积分变动记录表)
- id, user_id, change_type(earn/redeem/expire/admin_adjust)
- change_amount, balance_after, source_type, source_id, remark, operator_id
- created_at

#### redemption_items (兑换商品表)
- id, name, description, points_required, stock, rules, redeem_location
- is_active, sort_order

#### redemptions (兑换记录表)
- id, user_id, item_id, code(唯一兑换码), points_cost
- status(pending/redeemed/expired), redeemed_at, redeemed_by, expire_at
- created_at, updated_at

#### photo_works (健身掠影作品表)
- id, user_id, title, description, image_url, vote_count
- status(pending/approved/rejected), reviewed_by, reviewed_at

#### votes (投票记录表)
- id, user_id, photo_work_id, created_at
- **唯一索引**: (user_id, photo_work_id, DATE(created_at)) 防止每日重复投票

#### audit_logs (操作审计日志表)
- id, operator_id, operator_role, action, target_type, target_id
- detail(JSON), ip_address, user_agent, created_at

#### activities (活动配置表)
- id, name, description, start_date, end_date, point_expire_date
- checkin_enabled, voting_enabled, voting_start, voting_end, daily_vote_limit

#### system_configs (系统配置表)
- id, config_key(唯一), config_value, description, updated_by

#### sensitive_words (敏感词表)
- id, word(唯一), category

#### announcements (公告轮播图表)
- id, type(banner/notice/rule), title, content, image_url, link_url
- sort_order, is_active, start_time, end_time

---

## 四、核心模块详细设计

### 4.1 认证与权限

- **JWT双Token**: Access Token(2h, 内存存储) + Refresh Token(7d, httpOnly Cookie)
- **RBAC中间件**: 路由级角色校验，管理员拥有全部权限
- **登录锁定**: 连续5次失败 → 锁定10分钟，成功后归零
- **密码加密**: bcrypt (cost=12)

### 4.2 打卡审核

- **常规打卡**: 用户提交 → 审核/管理员审核 → 通过自动发积分 / 驳回填原因
- **轻盈计划**: 用户仅上传截图 → 仅管理员审核 → 管理员填写体重体脂 → 通过后用户可见
- **批量审核**: 事务保证原子性，批量驳回使用统一原因

### 4.3 积分系统

- **发放**: 审核通过触发，事务保证（打卡状态+积分记录+用户积分原子更新）
- **过期**: node-cron 每日00:00执行，活动结束+7天后自动清零
- **排行榜**: MySQL窗口函数 RANK() OVER，同分按首次达标时间排序

### 4.4 积分兑换

- **兑换码**: CB-时间戳-随机字符 格式
- **兑换事务**: 检查积分+检查库存 → 扣积分+扣库存+生成兑换码
- **核销**: 管理员验证兑换码 → 标记已核销 → 不可重复

### 4.5 健身掠影投票

- **限制**: 每用户每日3票，不可对同一作品重复投票
- **实现**: 数据库唯一索引 + Service层查询当日投票总数

---

## 五、API接口设计

### 5.1 接口规范

```
基础URL: /api/v1
响应格式: { code: 200, message: 'success', data: { ... } }
分页响应: { code: 200, data: { list: [...], pagination: { page, pageSize, total, totalPages } } }
```

### 5.2 核心接口清单

| 模块 | 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|------|
| 认证 | POST | /auth/register | 公开 | 用户注册 |
| | POST | /auth/login | 公开 | 登录 |
| | POST | /auth/refresh | 公开 | 刷新Token |
| | POST | /auth/reset-password | 公开 | 密码重置 |
| | PUT | /auth/password | user+ | 修改密码 |
| | PUT | /auth/profile | user+ | 修改个人信息 |
| 打卡 | GET | /tasks | user+ | 可参与任务列表 |
| | POST | /checkins | user | 提交打卡 |
| | GET | /checkins/mine | user | 我的打卡记录 |
| 轻盈计划 | POST | /weight-plan | user | 提交体重截图 |
| | GET | /weight-plan/mine | user | 我的体重记录 |
| 审核 | GET | /review/pending | reviewer+ | 待审核列表 |
| | POST | /review/:id/approve | reviewer+ | 审核通过 |
| | POST | /review/:id/reject | reviewer+ | 审核驳回 |
| | POST | /review/batch | reviewer+ | 批量审核 |
| | GET | /review/history | reviewer+ | 审核记录 |
| 轻盈计划审核 | GET | /weight-plan/pending | admin | 轻盈计划待审核 |
| | POST | /weight-plan/:id/review | admin | 轻盈计划审核 |
| 积分 | GET | /points/summary | user | 积分总览 |
| | GET | /points/logs | user | 积分明细 |
| 排行榜 | GET | /ranking | user+ | 积分排行榜 |
| 兑换 | GET | /redemption-items | user+ | 商品列表 |
| | POST | /redemptions | user | 兑换商品 |
| | GET | /redemptions/mine | user | 兑换记录 |
| | POST | /admin/redemptions/:code/redeem | admin | 核销兑换码 |
| 健身掠影 | POST | /photos | user | 投稿作品 |
| | GET | /photos | user+ | 作品列表 |
| | POST | /photos/:id/vote | user | 投票 |
| 管理员 | GET | /admin/dashboard | admin | 数据概览 |
| | GET | /admin/review/all | admin | 全量审核数据 |
| | POST | /admin/review/:id/override | admin | 复核修改审核结果 |
| | GET/POST/PUT | /admin/reviewers | admin | 审核员管理 |
| | GET/POST/PUT/DELETE | /admin/tasks | admin | 任务管理 |
| | GET/PUT | /admin/activities | admin | 活动配置 |
| | GET/POST/PUT | /admin/redemption-items | admin | 商品管理 |
| | GET | /admin/audit-logs | admin | 操作日志 |
| | POST | /admin/export/:type | admin | 数据导出 |
| | GET/PUT | /admin/configs | admin | 系统配置 |
| | GET/POST | /admin/sensitive-words | admin | 敏感词管理 |

---

## 六、前端页面设计

### 6.1 路由结构

```
/                           → 根据角色重定向
/login                      → 登录页
/register                   → 注册页
/reset-password             → 密码重置

/user/                      → 用户端（需 user 角色）
  /home                     → 首页
  /checkin                  → 打卡提交
  /checkin/history          → 审核进度
  /points                   → 积分管理
  /redemption               → 积分兑换
  /ranking                  → 排行榜
  /weight-plan              → 轻盈计划
  /photo-voting             → 健身掠影投票

/reviewer/                  → 审核员端
  /home                     → 审核概览
  /pending                  → 待审核列表
  /history                  → 审核记录

/admin/                     → 管理员端
  /dashboard                → 数据概览
  /review                   → 全量审核
  /weight-plan              → 轻盈计划审核
  /reviewers                → 审核员管理
  /tasks                    → 任务管理
  /activities               → 活动配置
  /redemption-items         → 商品管理
  /photos                   → 投稿投票管理
  /announcements            → 公告管理
  /audit-logs               → 操作日志
  /system-config            → 系统配置
  /sensitive-words          → 敏感词配置
  /export                   → 数据导出
```

### 6.2 PC端布局 (>=768px)
- Header: Logo + 活动名称 + 用户信息 + 退出
- Sidebar: 左侧固定导航菜单（管理员/审核员）
- 普通用户: 顶部导航栏 + 横向菜单
- 主内容区域: 根据路由渲染页面组件

### 6.3 移动端布局 (<768px)
- Header: 简化顶部
- 主内容区域: 全屏宽度，使用 List/Card 替代 Table
- TabBar: 底部导航（首页|打卡|积分|我的）

---

## 七、实施步骤

### 阶段一：基础架构搭建

1. **项目初始化**: Vite创建React+TS前端，初始化Express后端，配置ESLint/Prettier
2. **数据库初始化**: 编写DDL建表脚本，Sequelize定义Model及关联，种子数据脚本
3. **认证系统**: 注册/登录/JWT双Token/RBAC中间件/前端路由守卫

### 阶段二：核心业务功能

4. **任务管理**: 任务CRUD接口，动态表单字段配置，前端任务管理页
5. **打卡提交**: 图片上传，打卡提交（动态字段校验），敏感词过滤
6. **审核系统**: 审核员待审核列表，单条/批量审核（含积分自动发放事务）
7. **审核进度**: 用户打卡记录查询，轻盈计划数据可见性控制

### 阶段三：积分与兑换系统

8. **积分系统**: 积分总览/明细查询，积分过期定时任务，管理员手动调整
9. **排行榜**: 窗口函数查询，同分排序，当前用户高亮
10. **积分兑换**: 商品CRUD，兑换事务（扣积分+扣库存+生成兑换码），核销

### 阶段四：特色功能

11. **轻盈计划**: 体重截图提交，管理员专属审核（含体重体脂填写）
12. **健身掠影投票**: 作品投稿/审核，投票（每日限制校验）

### 阶段五：管理后台与系统功能

13. **数据概览**: Dashboard聚合查询（统计卡片+图表）
14. **审核员管理**: CRUD + 数据统计
15. **活动与系统配置**: 活动配置、公告轮播图、系统配置、敏感词管理
16. **数据导出**: Excel导出（打卡/积分/兑换/审核数据）
17. **操作日志与备份**: 日志查询、手动/自动备份

### 阶段六：测试与修复

18. **功能测试**: 全流程功能验证（注册→打卡→审核→积分→兑换→核销）
19. **安全测试**: 权限隔离验证、SQL注入/XSS防护、密码安全
20. **性能测试**: 页面加载≤2s，核心操作≤1s，500并发
21. **漏洞修复**: 修复测试中发现的所有问题

---

## 八、关键决策与注意事项

### 8.1 技术决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| PC/移动端适配 | 单代码库+布局分离 | 共享业务逻辑，减少维护成本 |
| 状态管理 | Zustand | 轻量，API简洁 |
| ORM | Sequelize | 复杂关联关系处理方便 |
| 实时排行榜 | 轮询(30s) | 500用户规模足够，降低复杂度 |
| 文件存储 | 本地磁盘 | 校园内网部署更简单 |
| 密码加密 | bcrypt (cost=12) | 生态成熟，性能安全平衡 |

### 8.2 数据一致性

- 积分发放：数据库事务保证原子性
- 积分兑换：事务 + 行级锁防止超卖
- 投票计数：事务保证原子性
- 并发审核：乐观锁/悲观锁防止重复审核

### 8.3 安全保障

- 密码bcrypt加密，禁止明文
- 中间件严格校验角色权限
- 用户数据隔离（只能查看自己的数据）
- 所有写操作记录审计日志
- 前后端双重输入校验
- 敏感词过滤
- 接口限流（express-rate-limit）

---

## 九、验证步骤

1. **数据库验证**: 所有表创建成功，外键关联正确，索引生效
2. **认证验证**: 注册/登录/锁定/Token刷新全流程通过
3. **权限验证**: 三种角色权限隔离正确，越权访问被拦截
4. **打卡流程验证**: 提交→审核→积分发放→排行榜更新 全链路通过
5. **轻盈计划验证**: 用户提交截图→管理员填写数据→审核通过→用户可见数据
6. **积分兑换验证**: 积分充足兑换→扣积分→生成兑换码→核销→不可重复
7. **投票验证**: 每日3票限制、不可重复投同一作品
8. **数据导出验证**: Excel导出内容完整、格式正确
9. **PC/移动端验证**: 两种布局正确渲染、交互正常
10. **安全验证**: 密码加密存储、权限隔离、审计日志完整
