// ── Quick smoke test: verify 镜中人 page renders with new story structure ──
const { chromium } = require("playwright");

function makeFrame(id, date, content, tags, tone) {
  return { id, date, time: "12:00", content, summary: content.substring(0, 10),
    tags, tone, createdAt: `${date}T12:00:00Z`, updatedAt: `${date}T12:00:00Z`,
    frameIndex: 1, wordCount: content.length, type: "text", status: "saved" };
}

const frames = [
  makeFrame("s1", "2026-04-25", "早起摸鱼写代码", ["开发","早晨"], "平静"),
  makeFrame("s2", "2026-04-26", "博物馆看古画展，光影很美", ["博物馆","古画","光影"], "轻松"),
  makeFrame("s3", "2026-04-27", "项目卡住了，反复调试", ["卡顿","调试"], "专注"),
  makeFrame("s4", "2026-04-28", "窗外的风很大，没出门", ["风","窗边"], "平静"),
  makeFrame("s5", "2026-04-29", "把一件很重的事轻轻放下了", ["放下","轻盈"], "平静"),
  makeFrame("s6", "2026-05-01", "光透过玻璃照在桌上", ["光","玻璃"], "轻松"),
  makeFrame("s7", "2026-05-02", "说了一半的话，没说完", ["没说完","迟疑"], "低沉"),
  makeFrame("s8", "2026-05-03", "画面终于可以动了", ["完成","高兴"], "轻松"),
  makeFrame("s9", "2026-05-04", "又卡住了，但这回不急", ["卡顿","耐心"], "平静"),
  makeFrame("s10","2026-05-05", "傍晚在窗边站了一会儿", ["傍晚","窗边","光"], "平静"),
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on("pageerror", e => console.log("FATAL:", e.message.substring(0, 200)));
  page.on("console", m => { if (m.type() === "error") console.log("ERR:", m.text().substring(0, 150)); });

  await page.goto("http://localhost:3001", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Inject frames
  await page.evaluate((f) => localStorage.setItem("jingxi_frames", JSON.stringify(f)), frames);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  // Navigate to film page
  await page.locator("button", { hasText: "查看时间胶片" }).click();
  await page.waitForTimeout(1000);

  // Check the entry text in header
  const pageText1 = await page.locator("body").textContent();
  const hasEntry = pageText1.includes("镜中似乎映出了些什么");
  console.log(`Entry text visible: ${hasEntry ? "✅ YES" : "❌ NO"}`);

  // Click entry
  const entryBtn = page.locator("button", { hasText: "镜中似乎映出了些什么" });
  if (await entryBtn.count() > 0) {
    await entryBtn.click();
    await page.waitForTimeout(20000);

    const text = await page.locator("body").textContent();
    console.log(`"镜中人" label: ${text.includes("镜中人") ? "✅ YES" : "❌ NO"}`);
    console.log(`"一则侧影" label: ${text.includes("一则侧影") ? "✅ YES" : "❌ NO"}`);
    console.log(`Story content: ${text.includes("那个人") || text.includes("镜子里") || text.includes("侧影") ? "✅ YES" : "❌ NO"}`);
    console.log(`"浮出的词" clue: ${text.includes("浮出的词") ? "✅ YES" : "❌ NO"}`);
    console.log(`"来自最近" frame count: ${text.includes("来自最近") ? "✅ YES" : "❌ NO"}`);
    console.log(`"重新映出" button: ${text.includes("重新映出") ? "✅ YES" : "❌ NO"}`);

    // Check NO forbidden words
    const forbidden = ["上次的回响","记录了","你写到了","导出信件","镜子另一边"];
    for (const w of forbidden) {
      if (text.includes(w)) console.log(`❌ FORBIDDEN TEXT: "${w}"`);
    }

    // Check floating words
    const floatCount = await page.locator("[style*='pointer-events: none']").count();
    console.log(`Floating words rendered: ${floatCount}`);

    await page.screenshot({ path: "E:/tmp/mirror_person.png" });
    console.log("Screenshot: E:/tmp/mirror_person.png");
  }

  await browser.close();
  console.log("\nDONE");
})();
