# Smart Note

> 便签 + 待办，多端同步的轻量笔记应用。对标 WPS 便签，叠加个性化智能特性。

详细产品需求见 [`需求文档.md`](./需求文档.md)。

---

## 技术栈

- **框架**：Next.js 16.2 (App Router) + React 19.2 + TypeScript
- **样式**：Tailwind CSS v4 + shadcn/ui
- **状态**：Zustand + TanStack Query
- **编辑器**：Tiptap (ProseMirror)
- **后端**：Supabase (Postgres + Auth + Storage + Realtime)
- **ORM**：Prisma 7
- **本地存储**：localForage (IndexedDB)
- **拖拽**：dnd-kit
- **表单**：React Hook Form + Zod
- **PWA**：Service Worker + manifest.json

## 当前进度

- [x] **M0** 项目骨架
- [x] **M1** 鉴权、分组、便签 CRUD、Tiptap 编辑器、图片上传（Storage）、回收站
- [x] **M2** 待办与聚合视图（`todo_items` 与便签 JSON 同步、`/todos` 今日/未来/已过期/无到期日、聚合勾选回写便签）

> **数据库**：若本地库在 M2 之前已创建，请再执行一次 `npm run db:push`，以创建 `todo_items(note_id, block_id)` 唯一约束（Prisma `@@unique`）。
- [x] **M3** 同步与离线：Supabase Realtime 订阅 `notes` / `groups` / `todo_items` + 防抖 `router.refresh`；IndexedDB 离线保存队列与成功快照缓存；`syncVersion` 乐观锁与冲突提示；联网自动重放队列（`npm run db:realtime` 将表加入 publication，见下文）
- [x] **M4** 推送：Web Push（`public/sw.js` + VAPID）、订阅写入 `push_subscriptions`、`/api/cron/remind` 扫描 `TodoItem.remindAt` 并发送通知；**生产环境由自建云服务器 crontab** 定时 `curl` 该接口（Vercel Hobby 不支持分钟级 [Vercel Cron](https://vercel.com/docs/cron-jobs/usage-and-pricing)）；**FCM 仍可选**（见需求文档 9）
- [ ] **M5** PWA 与体验细节

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env.local
```

按需填入。未配置 Supabase 时，落地页可打开但无法登录；配置后需完成下方「接入 Supabase」步骤。

### 3. 启动开发服务器

本项目 **`npm run dev` 固定使用 3005 端口**（避免与机器上其他 Next 项目抢默认 3000）。

```bash
npm run dev
```

访问 http://localhost:3005 。

健康检查：http://localhost:3005/api/health

若你临时用 `npx next dev` 等未带 `-p 3005` 的方式启动，实际端口可能变化，需在 **Supabase Redirect URLs** 中补对应端口的 `/auth/callback`（见下文）。

## 接入 Supabase（M1 之前完成）

1. 在 [Supabase Dashboard](https://supabase.com/dashboard) 创建项目
2. 进入 **Project Settings → API**，复制 URL / anon key / service_role key 到 `.env.local`
3. 进入 **Project Settings → Database → Connection string**，复制 Pooler 与 Direct URL 到 `DATABASE_URL` / `DIRECT_URL`
4. 在 **Authentication → Providers** 启用：
   - **GitHub**：在 GitHub **OAuth Apps**（不是 GitHub Apps）中创建应用，**Authorization callback URL** 填 Supabase 控制台显示的  
     `https://<project-ref>.supabase.co/auth/v1/callback`；**Homepage URL** 本地开发可填 `http://localhost:3005`（与 `npm run dev` 端口一致）。
   - **Email**：开启 Email/Password 模式
5. 推送 schema 到数据库：

   ```bash
   npm run db:push
   ```

6. **启用行级安全（RLS）与策略**（消除 Dashboard 里「RLS Disabled in Public」告警）：

   ```bash
   npm run db:rls
   ```

   也可在 Supabase **SQL Editor** 中手动粘贴执行 [`supabase/migrations/20260513000000_enable_rls_policies.sql`](./supabase/migrations/20260513000000_enable_rls_policies.sql)。

7. **Storage 图片桶**（便签内插图）：

   ```bash
   npm run db:storage
   ```

8. 在 **Authentication → URL Configuration** 中，将 **Redirect URLs** 加入你的站点回调。

   **本仓库约定**：开发服务器固定 **3005**，至少添加：

   - `http://localhost:3005/auth/callback`

   **可选（推荐）**：在 Supabase 里把 `http://localhost:3000/auth/callback` 一路加到 `http://localhost:3005/auth/callback` 共 6 条。这样偶尔不用项目脚本、端口落在 3000–3005 时 OAuth 仍能回调成功，代价是多几条白名单，可接受。

   生产环境再追加你的线上域名，例如 `https://你的域名/auth/callback`。

9. 重启 dev server，打开 `/login` 联调 GitHub / 邮箱登录与便签。

10. **Realtime（M3，多标签/多设备列表刷新）**  
    - 在 Supabase **Database → Publications** 确认 **`supabase_realtime`** publication 存在（默认即有）。  
    - 在本机执行（将业务表注册到 publication，供 `postgres_changes` 使用）：

      ```bash
      npm run db:realtime
      ```

      SQL 文件：[`supabase/migrations/20260513140000_realtime_publication.sql`](./supabase/migrations/20260513140000_realtime_publication.sql)。若某表已在 publication 中，对应 `ALTER` 可能报错，可在 Dashboard 中确认表已勾选后忽略。  
    - 官方说明：[Realtime Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)。

11. **Web Push 与定时提醒（M4）**  
    - 生成 VAPID：`npx web-push generate-vapid-keys`，将公钥填入 `NEXT_PUBLIC_VAPID_PUBLIC_KEY`、私钥填入 `VAPID_PRIVATE_KEY`，并设置 `VAPID_SUBJECT`（如 `mailto:你@邮箱`）。  
    - 设置 **`CRON_SECRET`**（随机长串）；Vercel 部署后在项目环境变量中同步配置；**任意**调用 `/api/cron/remind` 的调度方（本机、云服务器 crontab 等）须带 `Authorization: Bearer <CRON_SECRET>`。  
    - 设置 **`NEXT_PUBLIC_APP_URL`**（如本地 `http://localhost:3005`、生产 `https://你的域名`），用于通知点击链接。未设置时生产环境会回退到 `VERCEL_URL`。  
    - **生产调度（自建云服务器 crontab）**：Vercel **Hobby** 仅允许 [每天最多一次 Cron](https://vercel.com/docs/cron-jobs/usage-and-pricing)，无法在仓库内配置「每分钟」的 `vercel.json` Cron。请在可访问公网的云服务器上配置 `crontab`（`crontab -e`），例如**每分钟**扫描（将 `YOUR_SECRET` 换成与 Vercel 环境变量 `CRON_SECRET` **完全一致**的值，将 URL 换成生产站点 HTTPS 根地址，勿带末尾 `/`）：

      ```bash
      * * * * * curl -fsS -m 60 -H "Authorization: Bearer YOUR_SECRET" "https://你的生产域名/api/cron/remind" >>"$HOME/logs/smart-todo-cron.log" 2>&1
      ```

      首次可先手动执行同一条 `curl`（去掉重定向）确认返回 JSON 含 `ok`。若需更高频或把调度留在 Vercel 内，可升级 **Pro** 再使用 [Vercel Cron](https://vercel.com/docs/cron-jobs)。  
    - 本地手动触发扫描（需 dev server 已启动且 `.env.local` 已加载）：

      ```bash
      curl -s -H "Authorization: Bearer <你的CRON_SECRET>" http://localhost:3005/api/cron/remind
      ```

    - 一键自检（需 dev 或 `next start` 已监听对应端口，默认 `http://localhost:3005`）：`npm run verify:m4-cron`；测其他端口时先设环境变量 `CRON_TEST_URL`（如 `http://localhost:3006`）再执行。  
    - 登录后顶部 **「桌面提醒」** 可注册本机推送；**Chrome / Android PWA** 支持较好，Safari/iOS 能力因系统版本而异。  
    - 参考：[Web Push](https://developer.mozilla.org/docs/Web/API/Push_API)。
    - **上线 / 自测备忘（可在 IDE 里勾选）**  
      - [ ] 本地已用 `curl` 或 `npm run verify:m4-cron` 成功调用 `/api/cron/remind`（返回 JSON 含 `ok`）  
      - [ ] 若部署到 Vercel：项目 **Settings → Environment Variables** 已配置 `CRON_SECRET`、VAPID 相关变量、`NEXT_PUBLIC_APP_URL`（生产站点 HTTPS 根地址，用于通知点击链接）  
      - [ ] 已在目标浏览器登录并点击 **「桌面提醒」** 完成订阅（`push_subscriptions` 表有本机记录后再测提醒）  
      - [ ] 云服务器已配置 `crontab`（或等价定时任务）定时 `curl` 生产 `/api/cron/remind`，且 Bearer 与 Vercel 上 `CRON_SECRET` 一致（可先 `tail -f` 日志或临时去掉 `>>` 看输出）  
      - [ ] （可选）本地生产冒烟：`npm run build` 后 `npx dotenv -e .env.local -- npx next start -p 3006`，另开终端设置 `CRON_TEST_URL=http://localhost:3006` 再执行 `npm run verify:m4-cron`

## 常用脚本

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动开发服务器（Turbopack，**固定端口 3005**） |
| `npm run build` | 生产构建 |
| `npm run start` | 启动生产服务 |
| `npm run lint` | ESLint 检查 |
| `npm run typecheck` | TypeScript 类型检查 |
| `npm run db:generate` | 生成 Prisma Client |
| `npm run db:push` | 将 schema 同步到数据库（无迁移文件） |
| `npm run db:migrate` | 创建并应用迁移 |
| `npm run db:studio` | 打开 Prisma Studio |
| `npm run db:reset` | 重置数据库（开发环境） |
| `npm run db:rls` | 执行 RLS + Policy SQL（可重复执行） |
| `npm run db:storage` | 创建 `note-images` 桶及 Storage 策略（可重复执行） |
| `npm run db:realtime` | 将 `notes` / `groups` / `todo_items` 加入 `supabase_realtime` publication（可重复执行，已存在表可能报错可忽略） |
| `npm run verify:m4-cron` | M4：校验 Cron 相关环境变量并请求 `/api/cron/remind`（默认 `localhost:3005`，可用 `CRON_TEST_URL` 覆盖） |

## 目录结构

```
smart-todo/
├── 需求文档.md              # 产品需求文档（来源）
├── prisma/
│   └── schema.prisma        # 数据模型
├── supabase/
│   └── migrations/          # 手写 SQL（RLS 等），非 Supabase CLI 必须
├── public/
│   ├── manifest.json        # PWA 清单
│   ├── sw.js                # Service Worker（M4 Web Push）
│   └── icons/               # 应用图标（M5 补）
└── src/
    ├── app/                 # Next.js App Router
    │   ├── (auth)/login/    # 登录
    │   ├── (app)/notes/     # 便签
    │   ├── (app)/todos/     # 待办聚合
    │   └── api/
    │       ├── health/      # 健康检查
    │       └── cron/remind/ # M4 定时扫描待办提醒（需 CRON_SECRET）
    ├── components/
    │   ├── app/               # 全局面桥（M3 Realtime / 离线 flush）
    │   ├── ui/                # shadcn/ui
    │   ├── editor/          # Tiptap 编辑器（M1）
    │   ├── notes/           # 便签业务组件
    │   ├── todos/           # 待办业务组件
    │   ├── push/            # Web Push 订阅按钮（M4）
    │   └── layout/          # 布局组件
    ├── hooks/               # 自定义 React hooks
    ├── stores/              # Zustand stores
    ├── lib/
    │   ├── supabase/        # Supabase 客户端封装
    │   ├── db/              # Prisma 客户端
    │   ├── offline/         # IndexedDB 离线队列与缓存（M3）
    │   ├── push/            # VAPID 公钥解码等（M4）
    │   ├── todo/            # 待办与便签正文同步
    │   ├── utils.ts         # 工具函数
    │   └── constants.ts     # 常量
    ├── types/               # 全局类型
    └── proxy.ts             # Next.js 16 中间件
```

## Next.js 16 注意事项

> 本项目使用 Next.js 16，与历史习惯有 4 个差异：

1. 中间件文件名 / 导出名为 **`proxy`** 而非 `middleware`
2. `cookies()` / `headers()` / `params` / `searchParams` **必须 await**
3. 默认打包器为 **Turbopack**
4. 最小 Node.js 版本：**20.9+**

## License

私有项目（自用）。
