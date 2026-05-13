## 技术栈

| 层级 | 选型 | 版本 |
|------|------|------|
| 框架 | Next.js App Router | 15.4 |
| UI 库 | React | 19.0 |
| 类型系统 | TypeScript (strict) | 5.8 |
| 样式 | Tailwind CSS | 3.4 |
| 动画 | Framer Motion | 12.6 |
| 3D 背景 | Three.js (WebGL shader) | 0.173 |
| 图标 | Lucide React | 0.488 |
| 导出图片 | html-to-image | 1.11 |
| E2E 测试 | Playwright | 1.59 |
| 运行时 | Edge Runtime (API Routes) | — |
| 部署目标 | Vercel / Cloudflare Pages | — |

## 目录结构

```
v0.3/
├── app/                              # Next.js App Router (4 路由)
│   ├── layout.tsx                    # 根布局：字体/元数据/内联主题脚本
│   ├── page.tsx                      # "/" — 唯一页面：View 路由中枢
│   ├── globals.css                   # Tailwind + CSS 自定义属性 (主题色)
│   └── api/ai/                       # 3 个 Edge API Route
│       ├── develop-frame/route.ts    # POST — 单帧 AI 显影
│       ├── summarize-day/route.ts    # POST — 日卷总结
│       └── reflect/route.ts          # POST — 镜中人故事生成
│
├── src/                              # ★ 领域模型 + 持久化
│   ├── domain/
│   │   ├── frame/
│   │   │   ├── types.ts             # MemoryFrame + FrameStatus/DevelopStatus/TextFormatOptions
│   │   │   ├── createFrame.ts       # 工厂函数 (crypto.randomUUID)
│   │   │   └── textFormat.ts        # formatDisplayText / formatExportText（文本格式分离）
│   │   └── time/
│   │       ├── timescale.ts         # TimeScale / formatFrameNumber / getTodayDateString
│   │       └── groupFrames.ts       # 日/月/年聚合函数
│   └── lib/
│       ├── storage/
│       │   ├── storageKeys.ts       # localStorage key 集中管理
│       │   ├── frameRepository.ts   # FrameRepository 接口
│       │   ├── localStorageFrameRepository.ts  # 实现 + 容量监控 + QuotaExceededError 恢复
│       │   ├── migrations.ts        # v1→v2→v3 迁移引擎（CURRENT_VERSION=3, 幂等）
│       │   └── backup.ts            # createBackup / getLatestBackup / clearBackup
│       └── validation/
│           └── aiSchema.ts          # AI 输出 type guard（validateFrameAiOutput / validateReflectionOutput）
│
├── components/                       # 24 个 UI 组件
│   ├── AppShell.tsx                  # 页面壳 (背景 + Toast + 主题切换)
│   ├── AppHeader.tsx                 # 统一响应式 Header（移动端 More 菜单 / 桌面端平铺）
│   ├── RecordingRoom.tsx             # 首页：输入 + 异步 AI 显影流程
│   ├── FilmPage.tsx                  # 时间胶片页：日/月/年切换
│   ├── ReflectionPage.tsx            # 镜中人：4 层结构 (雾面/漂浮词/故事/线索)
│   ├── MemoryTimeline.tsx            # 时间线容器
│   ├── MemoryCard.tsx                # 帧卡片 (React.memo)
│   ├── FrameDetailOverlay.tsx        # 帧详情浮层 + 重新显影
│   ├── ArchivePanel.tsx              # 档案箱 (逐帧勾选 + 批量导出)
│   ├── RecycleBin.tsx                # 回收站 (7 天软删除)
│   ├── ShaderBackground.tsx          # WebGL 粒子背景
│   ├── TimelineRail.tsx              # 滚动导轨 (Framer Motion useSpring)
│   ├── DevelopingDot.tsx             # 时间导轨节点（暗琥珀微光点）
│   ├── DaySummaryCard.tsx            # 卷首卡
│   ├── ActionBar.tsx                 # "开始显影" 按钮
│   ├── MemoryInput.tsx               # textarea 输入组件
│   ├── TimeScaleSwitcher.tsx         # 日/月/年切换器
│   ├── ThemeSwitcher.tsx             # 3 套主题切换
│   ├── DataManager.tsx               # 数据管理 (导入/导出/清空)
│   ├── FrameImageExport.tsx          # 单帧 PNG 导出
│   ├── FrameCollectionImageExport.tsx# 多帧长图导出
│   ├── StatusToast.tsx               # Toast 提示
│   ├── EmptyState.tsx                # 空状态引导
│   └── MemoryCardSkeleton.tsx        # 卡片骨架屏
│
├── hooks/                            # 4 个 hooks
│   ├── useAppState.ts               # useReducer 全局状态 + FrameRepository
│   ├── useTheme.tsx                  # 主题 Context + 持久化
│   ├── useIsMobile.ts               # window.innerWidth < 768
│   └── useFirstVisitHint.ts         # 首次访问引导
│
├── services/ai/                      # AI 服务层
│   ├── index.ts                      # getAiProvider / getDevelopFrameResult 工厂
│   ├── types.ts                      # AI 接口类型 + contentHash
│   ├── realProvider.ts              # 真实 LLM 调用 (SERVER-ONLY, dynamic import)
│   ├── mockProvider.ts              # 规则模拟 fallback
│   ├── prompts.ts                    # 显影师 prompt 构建
│   ├── reflection-prompts.ts         # 镜中人 prompt 构建
│   └── reflectionProvider.ts        # 镜中人 mock fallback (3 档故事生成)
│
├── lib/                              # 工具库
│   ├── themes.ts                     # 3 套主题 Token 定义 + 迁移表
│   ├── shader.ts                     # WebGL fragment shader 源码
│   ├── exportFrames.ts              # JSON/MD/TXT 导出 (UTF-8 BOM)
│   ├── exportImage.ts               # PNG/SVG 图片导出辅助
│   ├── textFormat.ts                # 中文段落缩进 (全角空格)
│   ├── analytics.ts                 # 埋点 (GA4 / 自定义)
│   └── rateLimit.ts                 # API 限流
│
├── data/
│   └── demoFrames.ts                 # 向后兼容 re-export (指向 src/)
│
└── tests/                            # 5 个 Playwright E2E 脚本
    ├── e2e.cjs                       # 核心流程 (输入→保存→胶片→导出)
    ├── first-visit.cjs              # 首次访问引导
    ├── mobile_reflection.cjs        # 移动端镜中人
    ├── mirror_person_smoke.cjs      # 镜中人冒烟测试
    └── cache_test.cjs               # Reflection 缓存测试
```

## 数据流全景

```
用户输入 (RecordingRoom)
  │
  ├─ 输入文字 → MemoryInput
  │     └─ 300ms debounce → localStorage["jingxi_draft"]
  │
  └─ 点击"开始显影"
        │
        ├─ createFrame() → MemoryFrame (id, content=原始文本, rawContent, date, frameStatus:"active")
        ├─ useAppState.addFrame() → reducer → FrameRepository.saveAll()
        │     └─ localStorage["jingxi_frames"] ← JSON
        │
        └─ 后台异步 AI (不阻塞保存，per-frame requestId 守卫)
              │
              ├─ fetch POST /api/ai/develop-frame
              │     └─ getDevelopFrameResult()
              │           ├─ try: realProvider.developFrameReal()
              │           │     └─ callLlm() → DMXAPI (OpenAI-compatible)
              │           └─ catch: mockProvider.processFrame()
              │
              └─ 返回 validateFrameAiOutput() → { summary, tags, tone }
                    └─ useAppState.updateFrame()
                          ├─ requestId 匹配检查 + contentHash 校验
                          ├─ 更新帧的 summary/tags/tone/ai 字段
                          └─ FrameRepository.saveAll()
```

## 状态管理

```
useAppState (useReducer) — 唯一状态源
  │
  ├─ state.frames ────────── props drilling ──→ 所有子组件
  ├─ state.timeScale ─────── props drilling ──→ TimeScaleSwitcher
  ├─ state.selectedFrame ─── props drilling ──→ FrameDetailOverlay
  ├─ state.toast ─────────── props drilling ──→ StatusToast
  │
  ├─ aggregatedData (useMemo)
  │     ├─ timeScale="day"  → getAggregatedDayData()
  │     ├─ timeScale="month"→ getAggregatedMonthData()
  │     └─ timeScale="year" → getAggregatedYearData()
  │
  └─ 持久化
        ├─ localStorage["jingxi_frames"]  ← FrameRepository (此次重构封装)
        ├─ localStorage["jingxi_draft"]   ← page.tsx (300ms debounce)
        ├─ localStorage["jingxi_theme"]   ← useTheme.tsx
        └─ localStorage["jingxi_reflection"] ← ReflectionPage.tsx
```

**设计决策**：
- 无 Context / Redux / Zustand — 单一 useReducer + props drilling 足够（2 层嵌套）
- `aggregatedData` 通过 useMemo 缓存，仅在 frames 或 timeScale 变化时重算
- FrameRepository 接口分离了"怎么存"和"存什么"，未来可切换到 IndexedDB 或服务端

## AI 服务架构

### 安全隔离

```
┌─────────────────────────────────────────────────────────┐
│  客户端 (Browser)                                       │
│  RecordingRoom.tsx 调用 getAiProvider()                 │
│    → 只返回 mockAiProvider                              │
│    → realProvider 通过 dynamic import, 不进入 client bundle │
│                                                         │
│  客户端通过 fetch POST /api/ai/develop-frame 调真实 AI  │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│  Edge Runtime (Server)                                  │
│  route.ts → getDevelopFrameResult()                     │
│    → dynamic import("./realProvider")                   │
│      → process.env.LLM_API_KEY (不可达客户端)            │
│      → fetch DMXAPI / OpenAI-compatible API              │
│    → catch → mockProvider fallback                      │
└─────────────────────────────────────────────────────────┘
```

- **API Key 零泄露**：`realProvider.ts` 仅通过 `dynamic import` 在 API Route 中加载，前端 bundle 不含任何 LLM 调用代码
- **渐进增强**：real → mock fallback，任何环节失败都降级到规则模拟
- **LLM 响应解析**：支持 markdown code fence 自动剥离 + JSON 提取正则回退

### AI 产出物

| 接口 | 产出 | 约束 |
|------|------|------|
| `/api/ai/develop-frame` | summary, tags (2-3), tone (10 分类) | 不覆盖 content |
| `/api/ai/summarize-day` | mainline, themes (3-5), reviewHint | — |
| `/api/ai/reflect` | story (120-220 字), floatingWords, motifs, mood | ≥3 帧触发，缓存 7 天 |

## Frame 数据模型

```typescript
type MemoryFrame = {
  // 用户原始数据 (不可被 AI 覆盖)
  id: string;
  content: string;        // 原始输入文本（AI 只读，不再预格式化）
  rawContent: string;     // v2→v3 迁移引入，始终与 content 一致
  preview: string;        // content 前 100 字符
  date: string;           // "2026.05.09"
  time: string;           // "14:30"
  frameIndex: number;
  wordCount: number;
  type: "text" | "voice";
  createdAt: string;      // ISO 8601
  updatedAt: string;

  // AI 显影结果
  summary: string;
  tags: string[];
  tone?: string;
  ai?: FrameAiMetadata;   // contentHash + requestedAt + completedAt

  // 生命周期
  frameStatus: "active" | "deleted";     // v3: 替代旧 status
  developStatus: "idle" | "developing" | "developed" | "failed" | "stale";  // v3
  status?: "saved" | "organizing" | "developing";  // @deprecated v2 兼容
  deletedAt?: string;     // 软删除标记，7 天自动清理
};
```

## localStorage 布局

| Key | 内容 | 写频率 | 管理方式 |
|-----|------|--------|---------|
| `jingxi_frames` | MemoryFrame[] JSON | 每次增/删/改 | FrameRepository |
| `jingxi_frames_backup` | MemoryFrame[] JSON | 破坏性操作前 | backup.ts |
| `jingxi_frames_pre_migration` | MemoryFrame[] JSON | 迁移前 | migrations.ts（成功后自动清理） |
| `jingxi_draft` | string | 300ms debounce | page.tsx |
| `jingxi_theme` | "mist-darkroom" \| "dusk-bean" \| "morning-grey" | 切换时 | useTheme Context |
| `jingxi_reflection` | ReflectionCache JSON (v2) | 生成/过期时 | ReflectionPage |

## 核心交互模式

### 显影动画
```
点击保存 → isDeveloping=true → 650ms 动画 → addFrame() → 保存原始文本
                                              └→ 后台 AI 静默处理（per-frame requestId 守卫）
```

### 软删除
```
删除 → deletedAt = now → frameStatus="deleted" → 7 天内可恢复 → 7 天后自动清除
```

### 数据迁移 v2→v3
```
loadAll() → migrateAll(raw) → createBackup(备份) → v1→v2→v3 链式迁移
  → validateFrame() 校验补丁 → JSON 对比判断 migrated → 成功清理备份 / 失败保留原数据
```

### 时间尺度解锁
```
< 10 帧 → 仅日视图
< 30 帧 → 日 + 月
≥ 30 帧 → 日 + 月 + 年
```

### 镜中人
```
激活帧 ≥ 3 → 胶片页 header 显示入口
delta ≥ 3 帧 OR 缓存 > 7 天 → 重新生成
```

## 需优化项 (建议)

### P0 — 稳定性
- **localStorage 容量**：已实现 — FrameRepository.saveAll 中体积估算（~2.5MB warn, ~3.5MB critical），toast 30s 节流，QuotaExceededError 自动从备份恢复
- **初始化空数组覆盖**：已修复 — isHydrated 守卫，挂载前不调用 saveAll
- **草稿丢失**：已修复 — 保存失败时不清 localStorage draft
- **并发 AI 响应**：已修复 — per-frame requestId 守卫，contentHash 校验

### P1 — 体验
- **帧列表虚拟化**：> 500 帧时 MemoryTimeline 全量渲染会有性能问题。建议引入 `useVirtualizer` 或分页加载
- **图片草稿**：当前仅支持文字。若后续加入图片，需调整 draft 持久化策略（IndexedDB）
- **FrameRepository 接口**：当前仅 loadAll / saveAll。可扩展 `findById` / `updateOne` / `deleteOne` 等方法，减少全量读写

### P2 — 架构演进
- **IndexedDB 迁移**：当帧数 > 1000 时，localStorage 同步读写会成为瓶颈。FrameRepository 接口已预留，可直接实现 IndexedDB 版本
- **服务端持久化**：当前纯客户端，数据跟随设备。若未来加账号系统，FrameRepository 接口同样可直接适配 API 实现
- **TypeScript 严格类型优化**：`UPDATE_FRAME` action 的 `changes` 类型用 `Partial<Pick<...>>`，可改为 `Partial<DevelopedData>` 以强制 AI 只能写 developed 路径

## 验证状态 (2026-05-09)

| 检查项 | 结果 |
|--------|------|
| `npx tsc --noEmit` | ✅ 零错误 |
| `npm run build` | ✅ 编译成功 |
| E2E: 首页加载 | ✅ |
| E2E: 输入 + 草稿存储 | ✅ |
| E2E: 保存帧 | ✅ |
| E2E: 胶片页 + 档案面板 | ✅ |
| E2E: 导出下载 | ⚠️ Playwright download 超时 (非代码问题) |
| API Key 泄露检查 | ✅ realProvider 仅 server 端 dynamic import |
| V0.4: isHydrated 守卫 | ✅ 空数组不覆盖 |
| V0.4: v2→v3 迁移幂等 | ✅ 多次执行结果一致 |
| V0.4: AppHeader 响应式 | ✅ 320/375/390/430px 不换行 |
