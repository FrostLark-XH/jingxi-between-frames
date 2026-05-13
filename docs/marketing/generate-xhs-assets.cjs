const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { chromium } = require("playwright");

const outDir = path.join(__dirname);
const appUrl = process.env.JINGXI_PREVIEW_URL || "http://localhost:3001/";
const coverSource = path.join(outDir, "source-app-cover.png");

const now = Date.now();

function makeFrame(index, date, time, content, summary, tags, tone = "quiet") {
  return {
    id: `promo-${index}`,
    content,
    rawContent: content,
    preview: content.length > 100 ? `${content.slice(0, 100)}...` : content,
    summary,
    tags,
    tone,
    developed: { summary, tags, tone },
    ai: {
      provider: "mock",
      generatedAt: new Date(now - index * 3600_000).toISOString(),
      version: "promo",
      contentHash: `promo-${index}`,
    },
    date,
    time,
    frameIndex: index,
    wordCount: content.length,
    type: "text",
    status: "saved",
    frameStatus: "active",
    developStatus: "developed",
    createdAt: new Date(now - index * 3600_000).toISOString(),
    updatedAt: new Date(now - index * 3600_000).toISOString(),
  };
}

const frames = [
  makeFrame(
    1,
    "2026.05.14",
    "22:18",
    "晚上把窗帘拉开了一点，楼下的灯像一条很慢的河。今天没有发生什么大事，但我记得那阵风。",
    "一阵被记住的晚风，像从暗处慢慢亮起来。",
    ["夜晚", "风", "暗房"],
  ),
  makeFrame(
    2,
    "2026.05.14",
    "17:42",
    "路过便利店时买了热咖啡，杯壁很烫。想起有些日子并不需要被解释，只要被好好放进时间里。",
    "热咖啡和街角，把普通的一天轻轻收住。",
    ["咖啡", "街角", "停顿"],
  ),
  makeFrame(
    3,
    "2026.05.13",
    "23:06",
    "听了一首旧歌，前奏响起来的时候，好像某个很久以前的房间也亮了一秒。",
    "旧歌让一个房间短暂返场。",
    ["旧歌", "房间", "回声"],
  ),
  makeFrame(
    4,
    "2026.05.12",
    "09:20",
    "早上醒得很早，天色还没有完全透进来。手边散着几件小事，数字、记录时刻、没发出去的话。",
    "清晨还没完全显影，碎片先醒了。",
    ["清晨", "数字", "便签"],
  ),
  makeFrame(
    5,
    "2026.05.11",
    "00:12",
    "一个短促的问号，像光在暗房里忽然闪了一下，又安静下来。",
    "一个短促问号，在暗处亮了一下。",
    ["问号", "暗房", "停顿"],
  ),
];

const reflection = {
  version: 2,
  title: "一则侧影",
  story:
    "晨光还没有完全透进来，那个人坐在一个不确定的时间点上。手边散着几件小事：数字、旧歌、咖啡和没有发出去的话。它们并不整齐，却像从口袋里翻出的碎片，慢慢拼成一条安静的路。镜子没有给出答案，只把那些停顿、问号和微光放回原处。后来他站了一会儿，像是终于确认：有些日子没有被浪费，它们只是显影得很慢。",
  floatingWords: ["数字", "旧歌", "问号", "咖啡", "清晨", "暗房", "风", "房间"],
  motifs: ["停顿", "微光", "未说出口"],
  mood: ["安静", "轻微回望", "克制"],
  basedOnCount: frames.length,
  generatedAt: now,
  provider: "mock",
  model: "promo",
};

function svgText({ title, subtitle, index }) {
  return Buffer.from(`
  <svg width="900" height="1200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#020302" stop-opacity="0.18"/>
        <stop offset="0.52" stop-color="#020302" stop-opacity="0.08"/>
        <stop offset="1" stop-color="#020302" stop-opacity="0.72"/>
      </linearGradient>
      <radialGradient id="warm" cx="50%" cy="8%" r="62%">
        <stop offset="0" stop-color="#d6aa67" stop-opacity="0.24"/>
        <stop offset="0.4" stop-color="#5a3b21" stop-opacity="0.08"/>
        <stop offset="1" stop-color="#000000" stop-opacity="0"/>
      </radialGradient>
      <filter id="glow"><feGaussianBlur stdDeviation="14"/></filter>
    </defs>
    <rect width="900" height="1200" fill="url(#shade)"/>
    <rect width="900" height="1200" fill="url(#warm)"/>
    <rect x="448" y="0" width="2" height="1200" fill="#d7ad69" opacity="0.22"/>
    <rect x="444" y="88" width="10" height="270" fill="#d7ad69" opacity="0.18" filter="url(#glow)"/>
    <text x="64" y="96" font-family="serif" font-size="25" letter-spacing="7" fill="#d8cbbb" opacity="0.72">镜隙之间</text>
    <text x="64" y="1050" font-family="serif" font-size="54" letter-spacing="2" fill="#f2ede4">${title}</text>
    <text x="68" y="1106" font-family="sans-serif" font-size="22" letter-spacing="3" fill="#c6b38f" opacity="0.86">${subtitle}</text>
    <text x="760" y="96" font-family="monospace" font-size="18" letter-spacing="4" fill="#8f877b" opacity="0.64">0${index}/04</text>
  </svg>`);
}

async function rounded(buffer, width, height, radius) {
  const mask = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="${width}" height="${height}" rx="${radius}" ry="${radius}" fill="#fff"/></svg>`,
  );
  return sharp(buffer)
    .resize(width, height, { fit: "cover", position: "top" })
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
}

async function makePoster({ source, output, title, subtitle, index, align = "center" }) {
  const bg = await sharp(coverSource)
    .resize(900, 1200, { fit: "cover", position: "center" })
    .modulate({ brightness: 0.52, saturation: 0.75 })
    .blur(3)
    .png()
    .toBuffer();

  const screenW = 440;
  const screenH = 952;
  const screen = await rounded(await sharp(source).png().toBuffer(), screenW, screenH, 34);
  const x = align === "left" ? 92 : align === "right" ? 368 : 230;
  const y = 142;

  const phoneShadow = Buffer.from(`
  <svg width="900" height="1200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="36" stdDeviation="36" flood-color="#000" flood-opacity="0.65"/>
      </filter>
    </defs>
    <rect x="${x - 12}" y="${y - 12}" width="${screenW + 24}" height="${screenH + 24}" rx="46" fill="#0b0d0d" opacity="0.95" filter="url(#shadow)"/>
    <rect x="${x - 12}" y="${y - 12}" width="${screenW + 24}" height="${screenH + 24}" rx="46" fill="none" stroke="#80613d" stroke-opacity="0.24"/>
    <rect x="${x + 52}" y="${y - 2}" width="70" height="4" rx="2" fill="#caa56a" opacity="0.18"/>
  </svg>`);

  await sharp(bg)
    .composite([
      { input: phoneShadow, left: 0, top: 0 },
      { input: screen, left: x, top: y },
      { input: svgText({ title, subtitle, index }), left: 0, top: 0 },
    ])
    .png({ compressionLevel: 9 })
    .toFile(path.join(outDir, output));
}

async function captureScreens() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  await context.addInitScript(({ frames, reflection }) => {
    localStorage.setItem("jingxi_frames", JSON.stringify(frames));
    localStorage.setItem("jingxi_draft", "");
    localStorage.setItem("jingxi_theme", "mist-darkroom");
    localStorage.setItem("jingxi_reflection", JSON.stringify(reflection));
    localStorage.setItem("jingxi_first_visit_complete", "1");
  }, { frames, reflection });

  const page = await context.newPage();
  await page.goto(appUrl, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outDir, "source-screen-home.png"), fullPage: true });

  await page.getByText("查看时间胶片").click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outDir, "source-screen-film.png"), fullPage: true });

  await page.getByRole("button", { name: /镜中似乎映出了些什么/ }).click();
  await page.waitForTimeout(1600);
  await page.screenshot({ path: path.join(outDir, "source-screen-reflection.png"), fullPage: true });

  await page.goto(appUrl, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.getByText("查看时间胶片").click();
  await page.waitForTimeout(600);
  await page.getByRole("button", { name: "档案" }).click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, "source-screen-archive.png"), fullPage: true });

  await browser.close();
}

async function main() {
  await captureScreens();
  await makePoster({
    source: path.join(outDir, "source-screen-home.png"),
    output: "xhs-01-real-home.png",
    title: "把日记慢慢显影",
    subtitle: "写下一点今天，它会成为一帧记忆",
    index: 1,
    align: "center",
  });
  await makePoster({
    source: path.join(outDir, "source-screen-film.png"),
    output: "xhs-02-real-film.png",
    title: "时间会留下纹理",
    subtitle: "按日、月、年，看见生活的沉积",
    index: 2,
    align: "right",
  });
  await makePoster({
    source: path.join(outDir, "source-screen-reflection.png"),
    output: "xhs-03-real-reflection.png",
    title: "镜中浮出一点你",
    subtitle: "碎片够多时，记录会开始回望",
    index: 3,
    align: "left",
  });
  await makePoster({
    source: path.join(outDir, "source-screen-archive.png"),
    output: "xhs-04-real-archive.png",
    title: "把碎片安静收好",
    subtitle: "档案室导出文字与记忆卡片",
    index: 4,
    align: "center",
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
