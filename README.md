# sololive · 一个人也能去

一个「Solo Friendly」本地生活规划平台。很多人不是不想出门，而是缺一个「一个人也好玩」的理由：

> 一个人吃火锅有点尴尬、想露营没人陪、想看展不知道跟谁去、周末想出门却不知道干什么。

sololive 让用户输入 **时间 / 地点 / 预算 / 偏好**，自动规划一段 2~4 个活动的连贯行程（如 `18:30 一人食 → 20:00 脱口秀 → 21:30 夜间书店`），并可在「**一个人去**」和「**找 1~3 个搭子**」之间切换。短信验证码登录后，还能**收藏喜欢的店、记录去过几次、回看历史行程**。

## 技术栈

- **前端/后端**：Next.js 16（App Router + TypeScript + Tailwind CSS v4），移动优先的响应式 H5
- **数据**：Prisma + SQLite（本地零安装；生产可一行切 PostgreSQL）
- **认证**：手机号 + 短信验证码（为主）+ 密码（保留，`crypto.scrypt` 哈希 + httpOnly cookie 会话，零外部依赖）
- **地图**：高德地图 Web服务 API（地理编码 + 路线耗时）+ 高德 JS API 2.0（前端地图，可插拔）
- **算法**：纯 TypeScript，零外部依赖，可单测

## 核心算法（最短路径 + 动态规划）

规划引擎在 [src/lib/algorithms/](src/lib/algorithms/) 下，是纯函数、完全可离线运行：

| 步骤 | 算法 | 文件 |
| --- | --- | --- |
| 活动选择 | **0/1 背包 DP**（数量/预算/时长 三维资源约束下最大化总得分） | [knapsack.ts](src/lib/algorithms/knapsack.ts) |
| 距离矩阵 | **Floyd-Warshall** 全源最短路（另有 Dijkstra 单源最短路） | [shortestPath.ts](src/lib/algorithms/shortestPath.ts) |
| 访问顺序 | **Held-Karp 状态压缩 DP**（带起点的路径 TSP，最小化总移动耗时） | [tsp.ts](src/lib/algorithms/tsp.ts) |
| 编排 | 过滤 → 评分 → DP 选择 → 品类去重 → 定序 → 时刻表（超窗回退） | [planner.ts](src/lib/algorithms/planner.ts) |

旅行耗时：有 `AMAP_WEB_KEY` 时用高德真实路线耗时（[amap.ts](src/lib/amap.ts) 的 `routeMinutes` + `buildAmapTravelTime`），无 key 时降级为 haversine 估算。

## 快速开始

```bash
npm install                 # 安装依赖（postinstall 自动 prisma generate）

# 1. 配置环境变量
copy .env.example .env      # Windows；macOS/Linux 用 cp
#    DATABASE_URL 已默认指向本地 SQLite（file:./dev.db）

# 2. 建库 + 写入种子数据（17 个示例场馆，围绕上海五角场）
npm run db:push
npm run db:seed

# 3. 启动
npm run dev                 # http://localhost:3000
```

然后：右上角**验证码登录**（输入手机号 → 获取验证码 → 登录，开发模式下验证码自动回填）→ 填「今晚 / 上海·五角场 / 预算 100 / 不喝酒 / 一个人去 / 室内」→ 点「规划我的今晚」→ 对喜欢的店点「♡ 收藏」和「打卡」，在底部「我的收藏」看次数、「我的历史行程」回看每次规划。

其它命令：

```bash
npm test          # 算法 + 认证单元测试（vitest）
npm run build     # 生产构建
npm run db:push   # 同步 schema 到数据库
npm run db:seed   # 重置并写入种子数据
```

## 认证与我的（收藏/打卡/历史）

- **认证**：`POST /api/auth/sms/{send,verify}`（短信验证码登录，即注册）+ `POST /api/auth/{register,login,logout}`（密码登录）+ `GET /api/auth/me`。验证码用 [sms.ts](src/lib/sms.ts) 生成（当前开发模式打印到控制台并回传 devCode，接阿里云/腾讯云只换 `sendSmsCode`），密码用 scrypt 加盐哈希（[auth.ts](src/lib/auth.ts)），会话用 httpOnly cookie（[session.ts](src/lib/session.ts)），30 天有效。
- **收藏/打卡**：`GET/POST /api/me/favorites`（收藏列表 + toggle）+ `POST /api/me/checkins`（打卡 +1，记上次时间）。
- **历史行程**：`GET /api/me/plans`。登录后规划会归户到用户（[api/plan/route.ts](src/app/api/plan/route.ts) 写入 `userId`），这里按时间倒序回看。未登录访问以上路由均返回 401。

## 接入高德地图（可选）

没有 key 也能完整跑通（算法用种子数据 + haversine 估算，前端渲染相对位置示意图）。要「点亮」真实地图与地址解析，去 [高德开放平台](https://lbs.amap.com/) 申请：

1. 申请 **「Web服务」** 类型 key → 填入 `.env` 的 `AMAP_WEB_KEY`（用于后端地址地理编码 + 真实路线耗时）。
2. 申请 **「Web端（JS API）」** 类型 key 及其 **安全密钥 securityJsCode** → 填入：
   - `NEXT_PUBLIC_AMAP_JS_KEY`
   - `NEXT_PUBLIC_AMAP_SECURITY_CODE`

> 注意：JS API 2.0 必须在加载脚本**之前**写入 `window._AMapSecurityConfig`（已在 [AmapView.tsx](src/components/AmapView.tsx) 中处理）。Web服务 REST 用 GCJ-02 坐标，`location/origin/destination` 均传「经度,纬度」。

申请步骤：控制台 → 应用管理 → 创建新应用 → 添加 Key（选 Web端/JS API 平台；Web服务类型走服务端）。

## 项目结构

```
src/
  app/
    page.tsx                  # 首页（表单 + 结果 + 地图 + 收藏）
    api/plan/route.ts         # POST /api/plan  生成并持久化行程
    api/venues/route.ts       # GET  /api/venues 候选场馆
    api/auth/                 # register / login / logout / me / sms（send / verify）
    api/me/                   # favorites（收藏列表 + toggle）/ checkins（打卡）/ plans（历史行程）
  lib/
    algorithms/               # 规划引擎（纯函数 + 单测）
    amap.ts                   # 高德 Web服务 API adapter（geocode / routeMinutes）
    auth.ts                   # scrypt 密码哈希 + 会话 token（纯函数）
    sms.ts                    # 验证码生成 + 发送（可插拔，当前开发模式）
    session.ts                # cookie 会话读写（getCurrentUser 等）
    geo.ts / scoring.ts       # 距离估算 / 偏好评分
    seed-data/venues.ts       # 种子场馆（改 SEED_CENTER 换城市）
    prisma.ts / activity.ts
  components/                 # PlannerForm / ItineraryCard / AmapView / MapFallback / AuthBar / FavoritesPanel / HistoryPanel
  types/index.ts
prisma/schema.prisma          # Activity / Plan / PlanItem / User / Session / Favorite / CheckIn / SmsCode
tests/                        # vitest 单元测试（算法 + 认证）
```

## 换到你自己的大学

编辑 [src/lib/seed-data/venues.ts](src/lib/seed-data/venues.ts) 的 `SEED_CENTER`（改为你学校坐标），并把各场馆的 `lat/lng` 平移到学校周边 3 公里即可。

## MVP 边界与下一步

当前已实现：规划闭环（条件 → 算法 → 时刻表 + 地图 → 一人/搭子切换）、短信验证码登录（为主）+ 密码登录（保留）、收藏/打卡记录、我的历史行程。

明确不包含（避免过早复杂化）：

- 真实短信服务商（阿里云/腾讯云 SDK，当前为开发模式，接凭证即换）
- 微信登录
- 搭子实时匹配（「找搭子」仅记录意图）
- 支付 / 票务佣金 / 会员 / 全国数据

下一步建议：① 接入真实短信服务商；② User/搭子匹配表；③ 切换 PostgreSQL；④ 用 LLM 生成行程说明文案；⑤ 行程删除/编辑。
