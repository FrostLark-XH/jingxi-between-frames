// ── Mock AI provider — rule-based summary & tag generation ──────────────
// Implements AiProvider interface. Used as fallback when real AI is
// unavailable or LLM_API_KEY is not configured.

import { AiProvider, AiProviderType, FrameInput, FrameAiOutput, DaySummaryInput, DaySummaryOutput, DaySummaryProvider } from "./types";

// ── Tokenization ──────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  // particles / conjunctions / prepositions
  "的", "了", "是", "我", "你", "这", "那", "很", "就", "也", "都", "在",
  "不", "吗", "吧", "呢", "啊", "和", "与", "或", "但", "而", "且", "所",
  "以", "之", "及", "并", "从", "到", "被", "把", "让", "对", "向", "于",
  // function words (bigrams)
  "一个", "一下", "一些", "这个", "那个", "什么", "怎么", "为什么",
  "可以", "没有", "不是", "已经", "还是", "只是", "因为", "所以",
  "如果", "虽然", "但是", "然后", "之后", "以前", "现在", "正在",
  // temporal noise (we don't want these as tags)
  "今天", "昨天", "刚才", "刚刚", "现在",
  // filler / qualifier words
  "好像", "觉得", "感觉", "可能", "应该", "真的", "有点", "比较",
  "非常", "特别", "确实", "其实", "不过", "而且", "或者",
  "也许", "大概", "一直", "总是", "突然", "终于", "后来",
  "东西", "事情", "问题", "这个", "那个",
  // single characters that are rarely meaningful alone
  "想", "说", "看", "做", "去", "来", "会", "能", "要",
]);

function tokenize(text: string): string[] {
  const cleaned = text.replace(/[，。！？、；：""''（）《》【】\s,.!?;:'"()]+/g, " ");
  const segments = cleaned.split(" ").filter(Boolean);

  const tokens: string[] = [];
  for (const seg of segments) {
    if (seg.length <= 1) {
      if (!STOP_WORDS.has(seg)) tokens.push(seg);
      continue;
    }
    let i = 0;
    while (i < seg.length) {
      if (i + 1 < seg.length) {
        const bigram = seg.substring(i, i + 2);
        if (!STOP_WORDS.has(bigram)) tokens.push(bigram);
      }
      const char = seg[i];
      if (!STOP_WORDS.has(char) && char.length === 1 && /[一-鿿]/.test(char)) {
        tokens.push(char);
      }
      i++;
    }
  }
  return tokens;
}

function countTokens(tokens: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const t of tokens) counts.set(t, (counts.get(t) || 0) + 1);
  return counts;
}

// ── Summary generation ────────────────────────────────────────────────────

function generateSummary(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) return "你留下了一段记录。";

  const isQuestion = /[?？]$/.test(trimmed);
  const firstSentence = trimmed.split(/[。！？!?]/)[0].trim();
  const raw = firstSentence || trimmed;
  const clean = raw
    .replace(/^[，,、\s]+/, "")
    .replace(/^(今天|昨天|刚才|刚刚|现在)\s*/g, "")
    .trim();

  if (isQuestion) {
    if (clean.length <= 15) return `你在想：${clean.replace(/[?？]$/, "")}。`;
    const short = clean.length > 20 ? clean.substring(0, 20) + "…" : clean;
    return `你在确认${short.replace(/[?？]$/, "")}。`;
  }

  if (clean.length <= 18) return `你记录：${clean}。`;

  const short = clean.length > 22 ? clean.substring(0, 22).replace(/[，,、\s]+$/, "") + "…" : clean;
  return `你写下了关于「${short}」的一帧。`;
}

// ── Tag generation ────────────────────────────────────────────────────────

const EMOTION_MAP: Record<string, string> = {
  "开心": "愉悦", "快乐": "愉悦", "高兴": "愉悦", "兴奋": "兴奋",
  "难过": "低落", "伤心": "低落", "哭": "低落", "累": "疲惫",
  "疲惫": "疲惫", "困": "疲惫", "烦": "烦躁", "烦躁": "烦躁",
  "焦虑": "焦虑", "紧张": "紧张", "平静": "平静", "安静": "平静",
  "放松": "放松", "舒服": "放松", "温暖": "温暖", "感动": "感动",
  "期待": "期待", "希望": "期待", "想念": "思念", "思念": "思念",
  "迷茫": "困惑", "困惑": "困惑", "不确定": "困惑",
};

// High-priority topic rules — more specific patterns matched first.
// If a TOPIC_RULE matches, its tag always makes it into the final set.
const TOPIC_RULES: { pattern: RegExp; tag: string }[] = [
  { pattern: /镜隙|时间胶片|显影/, tag: "时间胶片" },
  { pattern: /设计|UI|UX|界面|交互|布局|组件|样式|配色|排版/, tag: "产品设计" },
  { pattern: /代码|编程|程序|bug|Bug|前端|后端|接口|API|部署|构建/, tag: "编程" },
  { pattern: /猫|喵|宠物|狗|狗狗/, tag: "猫" },
  { pattern: /通勤|地铁|公交|路上|堵车|交通|通勤路/, tag: "通勤" },
  { pattern: /灵感|想法|创意|点子|启发/, tag: "灵感" },
  { pattern: /音乐|听歌|歌单|播放|旋律|耳机/, tag: "音乐" },
  { pattern: /手机|移动端|触屏|响应式|适配/, tag: "移动端" },
  { pattern: /导出|文件|JSON|Markdown|TXT|下载/, tag: "导出" },
  { pattern: /输入|文本|编辑器|打字|草稿/, tag: "输入体验" },
  { pattern: /保存|数据|存储|localStorage|storage/, tag: "数据存储" },
  { pattern: /暗房|胶片|相机|拍照|摄影|取景/, tag: "摄影" },
  { pattern: /时间轴|时间线|归档|archive|档案/, tag: "归档" },
];

// Broader theme patterns — second pass after TOPIC_RULES.
const THEME_PATTERNS: { pattern: RegExp; tag: string }[] = [
  { pattern: /工作|上班|加班|开会|项目|任务|同事|老板|周报|日报/, tag: "工作" },
  { pattern: /读书|看书|课本|课程|考试|作业|学习|笔记/, tag: "学习" },
  { pattern: /电影|游戏|剧|番|动画|综艺|视频|刷剧/, tag: "娱乐" },
  { pattern: /天气|下雨|晴天|阴天|冷|热|风|雪|气温/, tag: "天气" },
  { pattern: /散步|跑步|运动|健身|游泳|锻炼/, tag: "运动" },
  { pattern: /咖啡|茶|吃|喝|早餐|午餐|晚餐|晚饭|午饭|早饭|食物|做饭|味道|甜品/, tag: "饮食" },
  { pattern: /朋友|聊天|见面|聚会|约饭|社交/, tag: "社交" },
  { pattern: /家|房间|收拾|打扫|清洁|整理/, tag: "日常" },
  { pattern: /睡|梦|醒|失眠|休息|困/, tag: "睡眠" },
  { pattern: /写|记录|日记/, tag: "记录" },
  { pattern: /回忆|过去|以前|小时候|记得|怀旧/, tag: "回忆" },
  { pattern: /思考|反思|觉察|意识|复盘/, tag: "思考" },
];

function generateTags(content: string): string[] {
  const trimmed = content.trim();
  if (!trimmed) return ["日常", "帧"];

  const tokens = tokenize(trimmed);
  const tokenCounts = countTokens(tokens);
  const tags = new Set<string>();

  // Pass 1: TOPIC_RULES — high-priority explicit topic match
  for (const { pattern, tag } of TOPIC_RULES) {
    if (pattern.test(trimmed)) tags.add(tag);
  }

  // Pass 2: THEME_PATTERNS — broader theme match
  for (const { pattern, tag } of THEME_PATTERNS) {
    if (pattern.test(trimmed)) tags.add(tag);
  }

  // Pass 3: EMOTION_MAP — emotion keywords from tokens
  for (const token of tokenCounts.keys()) {
    const emotion = EMOTION_MAP[token];
    if (emotion) tags.add(emotion);
  }

  // Pass 4: Frequency-based — top-2 non-noise tokens (bigrams only)
  const sorted = [...tokenCounts.entries()]
    .filter(([t]) => t.length >= 2 && !STOP_WORDS.has(t) && /^[一-鿿]{2,4}$/.test(t))
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([t]) => t);

  for (const t of sorted) {
    tags.add(t);
  }

  if (tags.size === 0) {
    tags.add("日常");
    tags.add("帧");
  }

  // Cap at 4 tags, prefer topic/emotion over frequency scraps
  return [...tags].slice(0, 4);
}

// ── Tone detection ─────────────────────────────────────────────────────────

function detectTone(content: string): string {
  const tonePatterns: [RegExp, string][] = [
    [/开心|快乐|高兴|哈哈|笑|太好了|棒|赞|nice/i, "愉悦"],
    [/难过|伤心|哭|泪|难受|心疼|遗憾|可惜/, "低落"],
    [/兴奋|激动|期待|迫不及待|太.*了/, "兴奋"],
    [/累|疲惫|困|乏|倦|没精神|不想动/, "疲惫"],
    [/焦虑|紧张|担心|害怕|不安|慌/, "焦虑"],
    [/暖|温馨|感动|真好|幸福/, "温暖"],
    [/期待|希望|盼|等.*来|快了/, "期待"],
  ];

  for (const [pattern, tone] of tonePatterns) {
    if (pattern.test(content)) return tone;
  }
  return "平静";
}

// ── Day mainline (mock) ───────────────────────────────────────────────────

function generateDayMainline(input: DaySummaryInput): DaySummaryOutput {
  const { date, frames } = input;
  if (frames.length === 0) {
    return {
      mainline: "今天还没有留下帧。",
      keywords: [],
      reviewHint: "可以回去记录一下今天。",
      provider: "mock",
    };
  }
  if (frames.length === 1) {
    return {
      mainline: "今天只留下了一帧，它记录了一个很具体的时刻。",
      keywords: frames[0].tags.slice(0, 3),
      reviewHint: "可以回看这一帧原始记录。",
      provider: "mock",
    };
  }

  // Count tags across all frames
  const tagCounts = new Map<string, number>();
  for (const f of frames) {
    for (const t of f.tags) {
      tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
    }
  }

  const sortedTags = [...tagCounts.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const keywords = sortedTags.map(([t]) => t);
  const topTag = sortedTags[0];

  if (topTag && topTag[1] >= frames.length * 0.6) {
    return {
      mainline: `今天的关键词是「${topTag[0]}」。`,
      keywords,
      reviewHint: `可以围绕「${topTag[0]}」回看今天的帧。`,
      provider: "mock",
    };
  }

  if (sortedTags.length >= 2) {
    return {
      mainline: `今天似乎围绕着「${sortedTags.map(([t]) => t).join("」与「")}」展开。`,
      keywords,
      reviewHint: "不妨回看今天的帧，也许会发现新的线索。",
      provider: "mock",
    };
  }

  return {
    mainline: `你在${date}留下了 ${frames.length} 帧。`,
    keywords,
    reviewHint: "可以回看今天的帧。",
    provider: "mock",
  };
}

// ── Provider implementation ───────────────────────────────────────────────

export const mockAiProvider: AiProvider & DaySummaryProvider = {
  type: "mock" as AiProviderType,

  async processFrame(input: FrameInput): Promise<FrameAiOutput> {
    const summary = generateSummary(input.content);
    const tags = generateTags(input.content);
    const keywords = tags.slice(0, 3);
    return {
      summary,
      tags,
      keywords,
      tone: detectTone(input.content),
      provider: "mock",
    };
  },

  async summarizeDay(input: DaySummaryInput): Promise<DaySummaryOutput> {
    return generateDayMainline(input);
  },
};
