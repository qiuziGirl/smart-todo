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

- [x] **M0** 项目骨架（当前）
- [ ] **M1** 便签 CRUD + 富文本编辑器
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

按需填入。M0 阶段允许保留占位值（应用可以启动，但登录/同步功能未启用）。

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 。

健康检查：http://localhost:3000/api/health

## 接入 Supabase（M1 之前完成）

1. 在 [Supabase Dashboard](https://supabase.com/dashboard) 创建项目
2. 进入 **Project Settings → API**，复制 URL / anon key / service_role key 到 `.env.local`
3. 进入 **Project Settings → Database → Connection string**，复制 Pooler 与 Direct URL 到 `DATABASE_URL` / `DIRECT_URL`
4. 在 **Authentication → Providers** 启用：
   - **GitHub**：填入 GitHub OAuth App 的 Client ID / Secret
   - **Email**：开启 Email/Password 模式
5. 推送 schema 到数据库：

   ```bash
   npm run db:push
   ```

6. 重启 dev server，登录功能即可联调。

## 常用脚本

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动开发服务器（Turbopack） |
| `npm run build` | 生产构建 |
| `npm run start` | 启动生产服务 |
| `npm run lint` | ESLint 检查 |
| `npm run typecheck` | TypeScript 类型检查 |
| `npm run db:generate` | 生成 Prisma Client |
| `npm run db:push` | 将 schema 同步到数据库（无迁移文件） |
| `npm run db:migrate` | 创建并应用迁移 |
| `npm run db:studio` | 打开 Prisma Studio |
| `npm run db:reset` | 重置数据库（开发环境） |

## 目录结构

```
smart-todo/
├── 需求文档.md              # 产品需求文档（来源）
├── prisma/
│   └── schema.prisma        # 数据模型
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
