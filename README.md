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
- **ORM**：Prisma 6
- **本地存储**：localForage (IndexedDB)
- **拖拽**：dnd-kit
- **表单**：React Hook Form + Zod
- **PWA**：Service Worker + manifest.json

## 当前进度

- [x] **M0** 项目骨架
- [x] **M1** 鉴权、分组、便签 CRUD、Tiptap 编辑器、图片上传（Storage）、回收站
- [ ] **M2** 待办与聚合视图
- [ ] **M3** 同步与离线
- [ ] **M4** 推送 (Web Push + FCM)
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
│   └── icons/               # 应用图标（M5 补）
└── src/
    ├── app/                 # Next.js App Router
    │   ├── (auth)/login/    # 登录
    │   ├── (app)/notes/     # 便签
    │   ├── (app)/todos/     # 待办聚合
    │   └── api/health/      # 健康检查
    ├── components/
    │   ├── ui/              # shadcn/ui
    │   ├── editor/          # Tiptap 编辑器（M1）
    │   ├── notes/           # 便签业务组件
    │   ├── todos/           # 待办业务组件
    │   └── layout/          # 布局组件
    ├── hooks/               # 自定义 React hooks
    ├── stores/              # Zustand stores
    ├── lib/
    │   ├── supabase/        # Supabase 客户端封装
    │   ├── db/              # Prisma 客户端
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
