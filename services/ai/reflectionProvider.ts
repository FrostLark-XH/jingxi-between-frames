// ── Mock reflection provider — rule-based "镜中人" story generation ─────
// Generates short dreamlike stories + floating words without real AI.

import { ReflectionInput, ReflectionStoryOutput, AiProviderName } from "./types";

function countByKey<T>(items: T[], keyFn: (item: T) => string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const k = keyFn(item);
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  return counts;
}

function extractFloatingWords(
  frames: ReflectionInput["frames"],
): string[] {
  const tagCounts = countByKey(
    frames.flatMap((f) => f.tags),
    (t) => t,
  );
  const toneCounts = countByKey(
    frames.map((f) => f.tone).filter((t): t is string => !!t),
    (t) => t,
  );

  const allWords = new Map<string, number>();
  for (const [word, count] of tagCounts) allWords.set(word, (allWords.get(word) || 0) + count);
  for (const [word, count] of toneCounts) allWords.set(word, (allWords.get(word) || 0) + count * 0.5);

  return [...allWords.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 16)
    .map(([w]) => w);
}

function generateStory(
  frames: ReflectionInput["frames"],
  spanDays: number,
): { story: string; motifs: string[]; mood: string[] } {
  const count = frames.length;

  // Collect tags and tones for motifs/mood
  const tagCounts = countByKey(frames.flatMap((f) => f.tags), (t) => t);
  const topTags = [...tagCounts.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([t]) => t);

  const toneCounts = countByKey(
    frames.map((f) => f.tone).filter((t): t is string => !!t),
    (t) => t,
  );
  const topTones = [...toneCounts.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([t]) => t);

  // Find shortest/longest frames for texture
  const sortedByLength = [...frames].sort((a, b) => a.content.length - b.content.length);
  const shortest = sortedByLength[0];
  const longest = sortedByLength[sortedByLength.length - 1];

  // Find frames with interesting tone shifts
  const uniqueTones = new Set(frames.map((f) => f.tone).filter(Boolean));

  // Build story based on frame count
  if (count <= 7) {
    const fragmentStory = [
      `晨光还没有完全透进来，那个人坐在一个不确定的时间点上。`,
      topTags.length > 0
        ? `手边散着几件小事——${topTags.slice(0, 3).join("、")}——都不太整齐，像从口袋里翻出来的东西。`
        : `手边散着几件小事，都不太整齐，像从口袋里翻出来的东西。`,
      shortest && shortest.content.length < 10
        ? `有一件很短——"${shortest.content}"——像一句话说了一半就被搁下了。`
        : `有几件还没整理好，搁在亮处和暗处的交界上。`,
      topTones.length > 0
        ? `空气里有一点${topTones[0]}的味道，但还没铺开。`
        : `空气静静的，还没铺开什么东西。`,
      `后来他站了一会儿，没有做什么特别的。有人从镜子里看了一眼，没说话。`,
    ].join("");
    return {
      story: fragmentStory,
      motifs: topTags.slice(0, 5),
      mood: topTones.length > 0 ? topTones.slice(0, 3) : ["安静", "缓慢"],
    };
  }

  if (count <= 20) {
    const threadStory = [
      `那段时间里，那个人反复弯下腰去拾一些东西。`,
      topTags.length > 0
        ? `${topTags[0]}、${topTags[1] || topTags[0]}——这些词像一根看不见的细线，穿过好几天。`
        : `有些词反复出现，像穿过好几天的细线。`,
      uniqueTones.size >= 2
        ? `日子有时${[...uniqueTones].slice(0, 2).join("，有时")}。他并不总在同一个地方。`
        : `他并不总在同一个地方，但有些东西一直跟着。`,
      longest && longest.content.length > 30
        ? `有一天写了很多，写到最后像是忘了停下来。`
        : `每一天都不太长，像刚好说到一个段落的末尾。`,
      shortest && shortest.content.length < 8
        ? `还有一天特别短，短到只剩下几个字——它不是不完整，只是刚好停在那里。`
        : `有些天只记了一小段，不多不少。`,
      `后来他直起腰，看了一眼玻璃里的自己——那个人也刚好看过来。`,
    ].join("");
    return {
      story: threadStory,
      motifs: topTags.slice(0, 5),
      mood: topTones.length > 0 ? topTones.slice(0, 3) : ["缓慢", "低光"],
    };
  }

  // 20+ frames — retrospective
  const retroStory = [
    `回头看过去，有些日子密集，有些日子空白——像一本翻得不太均匀的书。`,
    topTags.length > 0
      ? `${topTags.slice(0, 3).join("、")}——这些词散落在不同的页码里，构成了这段时间的底纹。`
      : `一些词散落在不同的页码里。`,
    uniqueTones.size >= 2
      ? `暗处和亮处交替出现。有时是${[...uniqueTones].slice(0, 2).join("，有时是")}。他记得一些，也忘了一些。`
      : `他记得一些，也忘了一些——不是刻意遗忘，只是有些东西沉下去了。`,
    `不是因为那些天不重要——只是它们不是同时亮起来的。`,
    `他翻了翻，合上书。镜子里有一个人，也刚做完同样的事。`,
  ].join("");
  return {
    story: retroStory,
    motifs: topTags.slice(0, 5),
    mood: topTones.length > 0 ? topTones.slice(0, 3) : ["回望", "尘埃"],
  };
}

export interface ReflectionProvider {
  reflect(input: ReflectionInput): Promise<ReflectionStoryOutput>;
}

export const mockReflectionProvider: ReflectionProvider = {
  async reflect(input: ReflectionInput): Promise<ReflectionStoryOutput> {
    const { frames } = input;
    const dates = frames.map((f) => f.date);
    const uniqueDates = new Set(dates);
    const spanDays = uniqueDates.size;

    const { story, motifs, mood } = generateStory(frames, spanDays);
    const floatingWords = extractFloatingWords(frames);

    return {
      story,
      floatingWords,
      motifs,
      mood,
      basedOnCount: frames.length,
      generatedAt: Date.now(),
      provider: "mock" as AiProviderName,
    };
  },
};
