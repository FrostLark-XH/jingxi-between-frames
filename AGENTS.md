# 镜隙之间 v0.9 + V0.4 稳定性优化

> Agent 操作约定。V0.9 冻结于 2026-05-01。V0.4 稳定性 8 阶段优化中。

## 技术栈

- Next.js 15 App Router + React 19 + TypeScript 5.8
- Tailwind CSS v3.4 + Framer Motion 12
- Three.js (shader 背景)
- localStorage 全量持久化
- Playwright 1.59 (E2E)

## 目录结构

```
v0.3/
├── app/                  # Next.js App Router
│   ├── layout.tsx        # 根布局（字体、元数据、主题初始化）
│   ├── page.tsx          # 唯一路由 "/" — 状态中枢
│   ├── globals.css       # Tailwind + CSS 变量（主题颜色）
│   └── api/ai/           # 3 个 Edge API Route
├── src/
│   ├── domain/
│   │   ├── frame/
│   │   │   ├── types.ts             # MemoryFrame + FrameStatus/DevelopStatus/TextFormatOptions
│   │   │   ├── createFrame.ts       # 工厂函数 (crypto.randomUUID)
│   │   │   └── textFormat.ts        # formatDisplayText / formatExportText
│   │   └── time/
│   │       ├── timescale.ts         # TimeScale / formatFrameNumber / getTodayDateString
│   │       └── groupFrames.ts       # 日/月/年聚合函数
│   └── lib/
│       ├── storage/
│       │   ├── storageKeys.ts              # localStorage key 集中管理
│       │   ├── frameRepository.ts          # FrameRepository 接口
│       │   ├── localStorageFrameRepository.ts  # localStorage 实现 + 容量监控
│       │   ├── migrations.ts               # v1→v2→v3 迁移引擎（CURRENT_VERSION=3）
│       │   └── backup.ts                   # createBackup / getLatestBackup / clearBackup
│       └── validation/
│           └── aiSchema.ts          # AI 输出 type guard（validateFrameAiOutput / validateReflectionOutput）
├── components/
│   ├── AppShell.tsx      # 页面壳（ShaderBackground + StatusToast + ThemeSwitcher）
│   ├── AppHeader.tsx     # 统一响应式 Header（移动端 More 菜单 / 桌面端平铺）
│   ├── RecordingRoom.tsx # 首页：输入 + 异步 AI 显影（per-frame requestId 守卫）
│   ├── FilmPage.tsx      # 时间胶片页
│   ├── ReflectionPage.tsx # 镜中人：4 层结构（背景/漂浮词/故事/线索）
│   ├── MemoryInput.tsx   # textarea 组件
│   ├── ActionBar.tsx     # "开始显影" 按钮
│   ├── MemoryTimeline.tsx# 时间线容器（日/月/年）
│   ├── MemoryCard.tsx    # 帧卡片（React.memo 优化）
│   ├── DevelopingDot.tsx  # 时间导轨节点（暗琥珀微光点）
│   ├── TimelineRail.tsx  # 滚动导轨（useSpring 驱动 DevelopingDot）
│   ├── ArchivePanel.tsx  # 档案箱（逐帧勾选 + 导出）
│   ├── RecycleBin.tsx    # 回收站
│   ├── DaySummaryCard.tsx# 卷首卡
│   ├── FrameDetailOverlay.tsx # 帧详情浮层
│   ├── TimeScaleSwitcher.tsx  # 日/月/年切换
│   ├── ThemeSwitcher.tsx # 主题切换（3 套）
│   ├── ShaderBackground.tsx   # WebGL 背景
│   ├── StatusToast.tsx   # Toast 提示
│   ├── EmptyState.tsx    # 空状态引导
│   ├── DataManager.tsx   # 数据管理面板（导入/导出/清空）
│   ├── FrameImageExport.tsx # 单帧 PNG 导出卡片渲染
│   ├── FrameCollectionImageExport.tsx # 多帧长图导出渲染
│   └── MemoryCardSkeleton.tsx # 卡片骨架屏
├── hooks/
│   ├── useAppState.ts    # useReducer 全局状态 + localStorage（isHydrated 守卫）
│   ├── useIsMobile.ts    # window.innerWidth < 768
│   ├── useTheme.tsx      # 主题切换 + 持久化
│   └── useFirstVisitHint.ts # 首访提示
├── lib/
│   ├── themes.ts         # 3 套主题颜色定义
│   ├── shader.ts         # WebGL shader 源码
│   ├── exportFrames.ts   # JSON/MD/TXT 导出（UTF-8 BOM）
│   ├── exportImage.ts    # PNG 导出 + 移动端分享
│   ├── analytics.ts      # 埋点
│   └── rateLimit.ts      # API 限流
├── services/ai/
│   ├── index.ts          # getAiProvider() 工厂 + real → mock fallback 编排
│   ├── types.ts          # AI 接口定义 + FrameAiOutput / ReflectionStoryOutput
│   ├── mockProvider.ts   # 规则模拟（摘要 + 标签）— fallback
│   ├── realProvider.ts   # 真实 LLM 调用（DMXAPI）— 服务端 only
│   ├── prompts.ts        # "显影师"角色 prompt 构建
│   ├── reflection-prompts.ts   # "镜中人生成器" prompt 构建
│   └── reflectionProvider.ts   # 镜中人 mock fallback（3 档故事生成）
├── data/
│   └── demoFrames.ts     # MemoryFrame 类型 + 聚合函数
└── tests/
    └── e2e.cjs           # Playwright E2E 测试
```

## 状态管理

- `useAppState` hook（useReducer）是唯一状态源
- **isHydrated 守卫**：初始挂载后才允许 `saveAll`，防止错误加载的空数组覆盖真实数据
- **Toast 节流**：容量警告 30 秒内不重复
- **备份策略**：`importFrames` / `clearAllFrames` 等破坏性操作前自动 `createBackup`
- localStorage key: `jingxi_frames`，备份 key: `jingxi_frames_backup`
- 草稿持久化 key: `jingxi_draft`（300ms debounce 写，仅内存清除不清 localStorage）
- 主题持久化 key: `jingxi_theme`
- 镜中人缓存 key: `jingxi_reflection`（version: 2，旧 v1 自动丢弃）
- 迁移预备份 key: `jingxi_frames_pre_migration`
- 数据流：`page.tsx` → props drilling → 子组件
- 无 Context、无 Redux、无 Zustand

## 核心模式

- **显影动画**：保存时 `isDeveloping=true` → 650ms 后 `addFrame()` → 清空草稿。AI 在后台静默处理
- **后台 AI 显影**：帧立即保存，AI（real → mock fallback）在后台更新 summary/tags/tone，不阻塞用户
- **per-frame requestId 守卫**：每帧保存时生成 `crypto.randomUUID()`，AI 回调时检查帧存在 + 未删除 + requestId 匹配，防止旧响应覆盖新帧或已删除帧
- **重新显影**：编辑原文后 FrameDetailOverlay 检测 `contentHash` 变化，可一键重新调用 AI
- **文本格式化分离**：`createFrame` 存原始文本，`formatDisplayText()` 负责展示，`formatExportText()` 负责导出
- **软删除**：设置 `deletedAt` 字段，7 天自动清除
- **移动端检测**：`useIsMobile()` hook，`< 768px`
- **移动端 Header**：AppHeader — 返回按钮 + 居中标题 truncate + More 菜单收纳次级入口，桌面端平铺
- **移动端保存条**：`fixed bottom-0` + `env(safe-area-inset-bottom)`，复用 ActionBar 组件
- **草稿保留**：页面切换/刷新不丢文字（key: `jingxi_draft`，300ms debounce）
- **时间尺度解锁**：< 10 帧仅日，< 30 加月，≥ 30 加年
- **镜中人**：≥3 帧时在胶片页 header 点击"镜中似乎映出了些什么 →"进入，4 层结构（雾面背景 / 漂浮词 / 故事卡 / 线索词），AI 生成 120-220 字镜中故事

## AI 数据结构

单帧显影（`/api/ai/develop-frame`）：
```ts
{ summary: string, tags: string[], tone: string }  // tags 2-3个，tone 10种固定分类
```

日卷总结（`/api/ai/summarize-day`）：
```ts
{ mainline: string, themes: string[], reviewHint: string }  // themes 3-5个
```

镜中人（`/api/ai/reflect`）：
```ts
{ title?, story, floatingWords, motifs, mood, basedOnCount }  // story 120-220字，需 ≥3 帧触发
```
缓存 key: `jingxi_reflection`，delta≥3 帧或 7 天后重新生成。

## 数据迁移

- `CURRENT_VERSION = 3`（v1→v2→v3 链式迁移）
- `MigrationResult = { success, frames, error?, migrated }` — 结构化迁移结果
- **幂等**：已含 `rawContent` + `frameStatus` 的帧在 v1→v2 直接透传
- **developStatus 推断**：从 AI 实际数据推断（ai.error → failed / contentHash 缺失 → developed / contentHash 不匹配 → stale）
- **rawContent 保护**：只在缺失时补，不覆盖已有值
- **迁移前备份**：`jingxi_frames_pre_migration`，迁移成功后自动清理

`MemoryFrame` 保留 `keywords?: string[]` 仅向后兼容，新帧不再生成。

## 边界

- 仅文字输入（语音已移除）
- 真实 LLM 显影（DMXAPI），mock fallback
- API Key 仅服务端，前端不直接调 LLM
- 无后端、无数据库、无账号
- 中文 only
- 导出仅 JSON/MD/TXT
- 无 AI 聊天、无心理分析

## 开发命令

```bash
npm run dev      # localhost:3000
npm run build    # 生产构建
npx next build   # 等同于 npm run build
node tests/e2e.cjs  # E2E 测试（需要先 npm run dev）
```

## 注意事项

- Playwright `fill()` 不触发 React onChange，测试用 `nativeInputValueSetter + dispatchEvent`
- 修改 `useAppState.ts` 的 localStorage 结构需要更新 `migrations.ts` 兼容旧数据
- 桌面端和移动端按钮渲染路径不同（`!isMobile` vs `showStickyBar`），改 ActionBar 逻辑时两边都要检查
- ArchivePanel 关闭按钮 touch 区 48px（`p-2`）
- AI 字段：新帧只有 `summary/tags/tone`，旧帧 `keywords` 由 migration 保留但不被 UI 读取
- Prompt 角色："暗房显影师 / 轻文学整理者"，summary 要求"克制的轻诗意"
- **迁移失败不写回**：`migrateAll` 返回 `success: false` 时 `loadAll` 不调用 `setItem`，原数据完整保留
