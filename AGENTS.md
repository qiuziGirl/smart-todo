<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## 协作与版本控制（必读）

- **禁止擅自提交/推送**：未经用户在对话中**明确口头要求**（例如明确说「请提交」「请 commit」「帮我 push」），不得执行 `git commit`、`git push`、以及等价于写入 Git 历史的自动化提交脚本。
- **允许**：`git status`、`git diff`、`git log`、`git branch` 等只读或审查类命令；以及用户**明确要求**的 `git add` / `git commit` / `git push`。
- **工作流**：助手完成代码修改后，由用户在本地**自行检查 diff** 后再手动 `git commit`；助手不代劳提交。

## 规则来源与多工具

- **本文件（`AGENTS.md`）** 为本仓库 **AI 与自动化助手的首选约定正文**。与具体工具无关的流程（含上一节 Git 约定）以本节及上文为准。
- **Claude Code**：根目录 [`CLAUDE.md`](./CLAUDE.md) 为入口，内含对本文的引用；约定冲突时以 **`AGENTS.md`** 为准。
- **Cursor**：[`.cursor/rules/`](./.cursor/rules) 下为指针型规则（`alwaysApply`），正文仍指向 **`AGENTS.md`**，避免多处维护长文。
- **Windsurf（Cascade）**：会索引根目录 **`AGENTS.md`**；另在 [`.windsurf/rules/`](./.windsurf/rules) 提供简短指针，便于与 Cascade 规则体系对齐。
- **Qorder 及其它工具**：若支持自定义「项目规则 / 上下文文件」，请**优先指向本仓库根目录 `AGENTS.md`**。若产品仅支持固定文件名、无法指向本文件，可将 **「协作与版本控制」** 整节复制到该文件，并在副本顶部注明：**「与根目录 `AGENTS.md` 同步；修改时请以 `AGENTS.md` 为准」**。
