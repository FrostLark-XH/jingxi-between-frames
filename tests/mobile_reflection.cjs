// ── Phase 3.5 Mobile Layout Test: 360/390/430px ──
const { chromium } = require("playwright");

const BASE = "http://localhost:3008";

const TEST_FRAMES = [
  {id:"t1",date:"2026-04-25",time:"08:10",content:"早起了一点",summary:"早期一点",tags:["早晨","日常"],tone:"平静",createdAt:"2026-04-25T08:10:00Z",updatedAt:"2026-04-25T08:10:00Z",frameIndex:1,wordCount:4,type:"text",status:"saved"},
  {id:"t2",date:"2026-04-25",time:"12:30",content:"午饭太咸了",summary:"午饭太咸",tags:["食物","午餐"],tone:"日常",createdAt:"2026-04-25T12:30:00Z",updatedAt:"2026-04-25T12:30:00Z",frameIndex:1,wordCount:4,type:"text",status:"saved"},
  {id:"t3",date:"2026-04-26",time:"19:00",content:"下班看到落日很美",summary:"落日很美",tags:["通勤","落日"],tone:"轻松",createdAt:"2026-04-26T19:00:00Z",updatedAt:"2026-04-26T19:00:00Z",frameIndex:1,wordCount:6,type:"text",status:"saved"},
  {id:"t4",date:"2026-04-27",time:"07:50",content:"猫又在门口等我",summary:"猫在门口等",tags:["猫","早晨"],tone:"日常",createdAt:"2026-04-27T07:50:00Z",updatedAt:"2026-04-27T07:50:00Z",frameIndex:1,wordCount:5,type:"text",status:"saved"},
  {id:"t5",date:"2026-04-28",time:"21:00",content:"看了几页书就睡着了",summary:"看书睡着",tags:["阅读","睡眠"],tone:"疲倦",createdAt:"2026-04-28T21:00:00Z",updatedAt:"2026-04-28T21:00:00Z",frameIndex:1,wordCount:6,type:"text",status:"saved"},
  {id:"t6",date:"2026-04-29",time:"15:00",content:"同事分了个橘子给我",summary:"同事给橘子",tags:["工作","食物"],tone:"轻松",createdAt:"2026-04-29T15:00:00Z",updatedAt:"2026-04-29T15:00:00Z",frameIndex:1,wordCount:6,type:"text",status:"saved"},
  {id:"t7",date:"2026-05-01",time:"11:00",content:"假期终于睡到中午了",summary:"睡到中午",tags:["假期","睡眠"],tone:"放松",createdAt:"2026-05-01T11:00:00Z",updatedAt:"2026-05-01T11:00:00Z",frameIndex:1,wordCount:6,type:"text",status:"saved"},
  {id:"t8",date:"2026-05-02",time:"16:30",content:"去超市买东西没带伞淋了雨",summary:"超市淋雨",tags:["购物","雨"],tone:"日常",createdAt:"2026-05-02T16:30:00Z",updatedAt:"2026-05-02T16:30:00Z",frameIndex:1,wordCount:9,type:"text",status:"saved"},
  {id:"t9",date:"2026-05-03",time:"20:00",content:"做饭不小心切到手指有点疼",summary:"做饭切手",tags:["晚餐","烹饪"],tone:"日常",createdAt:"2026-05-03T20:00:00Z",updatedAt:"2026-05-03T20:00:00Z",frameIndex:1,wordCount:9,type:"text",status:"saved"},
  {id:"t10",date:"2026-05-04",time:"22:00",content:"今天没什么特别的事发生",summary:"平淡一天",tags:["日常"],tone:"平静",createdAt:"2026-05-04T22:00:00Z",updatedAt:"2026-05-04T22:00:00Z",frameIndex:1,wordCount:7,type:"text",status:"saved"},
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const widths = [360, 390, 430];

  for (const width of widths) {
    console.log(`\n=== Testing at ${width}px ===`);
    const context = await browser.newContext({
      locale: "zh-CN",
      viewport: { width, height: 844 },
    });
    const page = await context.newPage();

    // Load the app
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);

    // Check data-theme on html
    const dataTheme = await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme")
    );
    console.log(`  data-theme: ${dataTheme}`);

    // Inject frames into localStorage
    await page.evaluate((frames) => {
      localStorage.setItem("jingxi_frames", JSON.stringify(frames));
    }, TEST_FRAMES);

    // Reload to pick up frames
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(1500);

    // Debug: check localStorage state
    const lsState = await page.evaluate(() => {
      const raw = localStorage.getItem("jingxi_frames");
      if (!raw) return "EMPTY";
      try {
        const frames = JSON.parse(raw);
        return `frames=${frames.length}, keys=${Object.keys(frames[0] || {}).join(",")}`;
      } catch { return "PARSE_ERROR"; }
    });
    console.log(`  localStorage: ${lsState}`);

    // Find and enumerate buttons
    const allButtons = page.locator("button");
    const count = await allButtons.count();
    const buttonTexts = [];
    for (let i = 0; i < count; i++) {
      const text = await allButtons.nth(i).textContent().catch(() => "");
      if (text.trim()) buttonTexts.push(text.trim());
    }
    console.log(`  Buttons (${buttonTexts.length}): ${buttonTexts.join(" | ")}`);

    // Click "查看时间胶片" to go to film page
    const filmBtn = page.locator("button", { hasText: "查看时间胶片" });
    if ((await filmBtn.count()) > 0) {
      await filmBtn.click();
      await page.waitForTimeout(1500);
      console.log("  Clicked '查看时间胶片'");
    }

    // Now enumerate buttons on film page
    const filmBtns = page.locator("button");
    const fCount = await filmBtns.count();
    const fTexts = [];
    for (let i = 0; i < fCount; i++) {
      const t = await filmBtns.nth(i).textContent().catch(() => "");
      if (t.trim()) fTexts.push(t.trim());
    }
    console.log(`  Film buttons: ${fTexts.join(" | ")}`);

    // Look for "镜子另一边" button on film page
    const reflectionBtn = page.locator("button", { hasText: "镜子另一边" });
    const hasReflectionBtn = (await reflectionBtn.count()) > 0;
    console.log(`  '镜子另一边' button: ${hasReflectionBtn}`);

    if (hasReflectionBtn) {
      // Pre-seed reflection cache so we can test letter layout immediately
      await page.evaluate(() => {
        const cache = {
          body: "你好，10天间的记录者。这几帧里写到了两次食物——午餐的咸、同事的橘子。中间隔着几天，几天里写了落日、猫、和一本没看完的书。帧与帧之间，有些词在反复出现：睡眠、日常、平静。五一那天你睡得最久，假期像一个很长的停顿。最后一天很短，只是说没什么特别的。没什么特别本身就是一种特别——停顿也是一种记录。",
          floatingWords: ["落日","睡眠","橘子","雨","猫","烹饪","假期","早晨","购物","通勤","平静"],
          generatedAt: Date.now() - 1000,
          frameCount: 10,
          spanDays: 10,
          provider: "mock",
          version: 1,
        };
        localStorage.setItem("jingxi_reflection", JSON.stringify(cache));
      });
      console.log("  Pre-seeded reflection cache");

      await reflectionBtn.click();
      await page.waitForTimeout(2000);
      console.log("  Clicked '镜子另一边'");

      // Check reflection page content
      const pageText2 = await page.locator("body").textContent();
      const hasLetter = pageText2.includes("记录者");
      const hasCacheLabel = pageText2.includes("上次的回响");
      const hasBackBtn = pageText2.includes("返回");
      const hasRegen = pageText2.includes("重新生成");
      const hasLoading = pageText2.includes("正在读取");
      console.log(`  Letter: ${hasLetter} | Cache: ${hasCacheLabel} | Back: ${hasBackBtn} | Regen: ${hasRegen} | Loading: ${hasLoading}`);

      // Check for floating words container
      const floatingEls = await page.locator("[style*='pointer-events: none']").count();
      console.log(`  Floating word elements: ${floatingEls}`);
    }

    // Take screenshot
    const screenshotPath = `E:/tmp/mobile_${width}px.png`;
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`  Screenshot: ${screenshotPath}`);

    // Overflow check
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const vw = await page.evaluate(() => window.innerWidth);
    const hasOverflow = bodyWidth > vw;
    console.log(`  bodyWidth=${bodyWidth} viewport=${vw} overflow=${hasOverflow}`);

    // Content check
    const pageText = await page.locator("body").textContent();
    const hasLetter = pageText.includes("记录者");
    const hasEmpty = pageText.includes("再多记录几帧");
    const hasBackBtn = pageText.includes("返回");
    console.log(`  Letter: ${hasLetter} | Empty: ${hasEmpty} | Back: ${hasBackBtn}`);

    await context.close();
  }

  console.log("\n=== DONE ===");
  await browser.close();
})();
