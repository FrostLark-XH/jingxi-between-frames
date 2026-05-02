# 镜隙之间 部署指南

> V0.9 手机实验版 / PWA 部署说明。

## 快速部署（Vercel）

1. Fork 或推送本仓库到 GitHub
2. 在 [vercel.com](https://vercel.com) 导入项目
3. 框架自动识别为 Next.js，无需修改构建配置
4. 在项目 Settings → Environment Variables 中添加以下环境变量：

| 变量 | 值 | 说明 |
|------|-----|------|
| `LLM_PROVIDER` | `dmxapi` | 固定值 |
| `LLM_API_KEY` | `sk-...` | DMXAPI token，切勿公开 |
| `LLM_BASE_URL` | `https://www.dmxapi.cn/v1` | API 地址 |
| `LLM_MODEL` | `DeepSeek-V3.2` | 当前使用的模型 |

5. 点击 Deploy
6. 部署完成后，用手机浏览器打开 Vercel 提供的 `.vercel.app` 地址
7. 在 Safari (iOS) 或 Chrome (Android) 中选择「添加到主屏幕」

## 环境变量说明

所有 LLM 相关环境变量仅在服务端可见（Next.js API Routes），前端不会暴露 API Key。

- `LLM_PROVIDER` — 目前仅支持 `dmxapi`。支持的 provider 列表见 `services/ai/realProvider.ts`
- `LLM_API_KEY` — 格式为 `sk-...` 前缀的 raw key（非 Bearer 模式）
- `LLM_MODEL` — DMXAPI 模型 ID。推荐 `DeepSeek-V3.2`（非 thinking），1–2 秒延迟

## 注意事项

- **不要提交 `.env.local`** — 已在 `.gitignore` 中
- **修改环境变量后需要重新部署** — Vercel 不会自动重新构建环境变量变更
- `LLM_BASE_URL` 变更时可能需要更新 `realProvider.ts` 中的 `detectProvider()` 逻辑
- 部署后首次 AI 调用可能较慢（冷启动），后续请求恢复正常

## 本地开发

```bash
cp .env.example .env.local  # 如果没有 .env.local
# 编辑 .env.local 填入真实 key
npm run dev
```
