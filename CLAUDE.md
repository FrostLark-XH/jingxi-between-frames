# 镜隙之间 v0.3/v0.4

> Agent 操作约定。保持简洁，避免过时。

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
│   └── globals.css       # Tailwind + CSS 变量（主题颜色）
├── components/
│   ├── AppShell.tsx      # 页面壳（ShaderBackground + StatusToast + ThemeSwitcher）
│   ├── RecordingRoom.tsx # 首页：输入 + 保存
│   ├── FilmPage.tsx      # 时间胶片页
│   ├── MemoryInput.tsx   # textarea 组件
│   ├── ActionBar.tsx     # "开始显影" 按钮
│   ├── MemoryTimeline.tsx# 时间线容器（日/月/年/片段）
│   ├── MemoryCard.tsx    # 帧卡片（React.memo 优化）
│   ├── TimelineRail.tsx  # 滚动导轨（useSpring 驱动光点）
│   ├── ArchivePanel.tsx  # 档案箱（逐帧勾选 + 导出）
│   ├── RecycleBin.tsx    # 回收站
│   ├── DaySummaryCard.tsx# 卷首卡
│   ├── FrameDetailOverlay.tsx # 帧详情浮层
│   ├── TimeScaleSwitcher.tsx  # 日/月/年/片段切换
│   ├── ThemeSwitcher.tsx # 主题切换（3 套）
│   ├── ShaderBackground.tsx   # WebGL 背景
│   ├── StatusToast.tsx   # Toast 提示
│   ├── EmptyState.tsx    # 空状态引导
│   └── MemoryCardSkeleton.tsx # 卡片骨架屏
├── hooks/
│   ├── useAppState.ts    # useReducer 全局状态 + localStorage
│   ├── useIsMobile.ts    # window.innerWidth < 768
│   └── useTheme.tsx      # 主题切换 + 持久化
├── lib/
│   ├── themes.ts         # 3 套主题颜色定义
│   ├── shader.ts         # WebGL shader 源码
│   ├── exportFrames.ts   # JSON/MD/TXT 导出（UTF-8 BOM）
│   └── textFormat.ts     # 中文段落缩进
├── services/ai/
│   ├── index.ts          # getAiProvider() 工厂
│   ├── types.ts          # AI 接口定义
│   └── mockProvider.ts   # 规则模拟（摘要 + 标签）
├── data/
│   └── demoFrames.ts     # MemoryFrame 类型 + 聚合函数
└── tests/
    └── e2e.cjs           # Playwright E2E 测试
```

## 状态管理

- `useAppState` hook（useReducer）是唯一状态源
- localStorage key: `jingxi_frames`
- 草稿持久化 key: `jingxi_draft`（300ms debounce 写）
- 主题持久化 key: `jingxi_theme`
- 数据流：`page.tsx` → props drilling → 子组件
- 无 Context、无 Redux、无 Zustand

## 核心模式

- **显影动画**：保存时 `isDeveloping=true` → 600ms blur + overlay pulse → `addFrame()` → 清空草稿
- **软删除**：设置 `deletedAt` 字段，7 天自动清除
- **移动端检测**：`useIsMobile()` hook，`< 768px`
- **移动端保存条**：`fixed bottom-0` + `env(safe-area-inset-bottom)`，复用 ActionBar 组件
- **草稿保留**：页面切换/刷新不丢文字
- **时间尺度解锁**：< 10 帧仅日/片段，< 30 加月，≥ 30 加年

## 边界

- 仅文字输入（语音已移除）
- 无后端、无数据库、无账号
- 无真实 AI（规则模拟）
- 中文 only
- 导出仅 JSON/MD/TXT

## 开发命令

```bash
npm run dev      # localhost:3013
npm run build    # 生产构建
npx next build   # 等同于 npm run build
node tests/e2e.cjs  # E2E 测试（需要先 npm run dev）
```

## 注意事项

- Playwright `fill()` 不触发 React onChange，测试用 `nativeInputValueSetter + dispatchEvent`
- 修改 `useAppState.ts` 的 localStorage 结构需要更新 `migrateFrame()` 兼容旧数据
- 桌面端和移动端按钮渲染路径不同（`!isMobile` vs `showStickyBar`），改 ActionBar 逻辑时两边都要检查
- ArchivePanel 关闭按钮 touch 区 48px（`p-2`）
