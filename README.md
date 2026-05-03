# 镜隙之间 · Between Frames

> 时间正在被温柔地记录。每一次记录，都像在镜子的缝隙里留下一个微小切面。

一款面向个人生活记录的 AI 日记应用。写下生活碎片，AI 以"暗房显影师"的身份轻整理——不替代你的表达，只是把时间沉淀成可触摸的形状。

**线上地址**：[v03-amber.vercel.app](https://v03-amber.vercel.app)

---

## 设计哲学

- **用户文字是第一位的** — AI 只做轻整理，不替用户说话
- **暗房隐喻** — 文字是底片，AI 是显影液，时间是定影剂
- **安静、克制、有仪式感** — 不花哨，不社交，不鸡汤

## 核心功能

- 文字记录生活碎片，保存时自动首行缩进
- AI 显影：为每一帧生成摘要、标签（2-3 个）、情绪基调（10 种分类）
- 时间胶片：日/月/年三级时间尺度浏览，滚动导轨 + 微光节点
- 3 套主题：冷灰暗房 / 暖玫旧纸 / 晨雾米纸
- 帧详情编辑、标签管理、软删除回收站（7 天自动清除）
- 重新显影：编辑原文后可一键重新调用 AI
- 导出系统：单帧/多帧/档案批量导出 PNG 卡片 + JSON/MD/TXT
- PWA 离线支持，移动端优先

## 技术栈

| 层 | 选型 |
|---|------|
| 框架 | Next.js 15 App Router + React 19 |
| 语言 | TypeScript 5.8 |
| 样式 | Tailwind CSS 3.4 + CSS 变量主题系统 |
| 动画 | Framer Motion 12 |
| 背景 | Three.js WebGL Shader |
| AI | LLM API（DMXAPI），mock fallback |
| 持久化 | localStorage（`jingxi_frames`） |
| 测试 | Playwright 1.59 |
| 部署 | Vercel |

## 版本演进

| 版本 | 交付 |
|------|------|
| V0.6 | 真实 LLM 显影引擎，后台静默 AI 处理 |
| V0.7 | AI 字段收口（summary/tags/tone），重新显影，暗房显影师 prompt |
| V0.8 | 单帧/多帧 PNG 导出卡片，ArchivePanel 导出系统 |
| **V0.9** | 导出卡片信息层级重构（原文为主），PWA 真机修复，两步确认导出 |

## 本地运行

```bash
cd v0.3
npm install
npm run dev        # http://localhost:3000
```

构建：

```bash
npm run build
```

## 目录

```
v0.3/
├── app/            # Next.js App Router（页面 + API 路由）
├── components/     # 22 个 React 组件
├── hooks/          # useAppState / useTheme / useIsMobile
├── lib/            # 主题、导出、限流、埋点、Shader
├── services/ai/    # AI 显影服务层（real → mock fallback）
├── data/           # MemoryFrame 类型定义与聚合
├── public/         # PWA 图标与静态资源
├── docs/           # 项目文档（freeze / product / ops）
├── tests/          # Playwright E2E 测试
└── .github/        # CI/CD（Cloudflare + Vercel 自动部署）
```
