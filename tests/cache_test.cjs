// ── Phase 3.5: Empty state + Cache logic + Entry button tests ──
const { chromium } = require("playwright");

const BASE = "http://localhost:3008";

function makeFrame(id, date, content) {
  return {
    id, date, time: "12:00", content, summary: content.substring(0, 10),
    tags: ["日常"], tone: "平静", createdAt: `${date}T12:00:00Z`,
    updatedAt: `${date}T12:00:00Z`, frameIndex: 1, wordCount: content.length,
    type: "text", status: "saved",
  };
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  // ── Test 1: Empty state (< 5 frames) ──
  console.log("=== Test 1: Empty state (3 frames) ===\n");
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const fewFrames = [
      makeFrame("e1", "2026-05-01", "test1"),
      makeFrame("e2", "2026-05-02", "test2"),
      makeFrame("e3", "2026-05-03", "test3"),
    ];
    await page.evaluate((f) => localStorage.setItem("jingxi_frames", JSON.stringify(f)), fewFrames);
    // Clear any cache
    await page.evaluate(() => localStorage.removeItem("jingxi_reflection"));
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(1500);

    // Go to film page
    const filmBtn = page.locator("button", { hasText: "查看时间胶片" });
    if (await filmBtn.count() > 0) await filmBtn.click();
    await page.waitForTimeout(1000);

    // Check: "镜子另一边" button should NOT be visible (< 5 frames)
    const reflectionBtn = page.locator("button", { hasText: "镜子另一边" });
    const entryVisible = (await reflectionBtn.count()) > 0;
    console.log(`  Entry button visible (<5 frames): ${entryVisible} ${entryVisible ? "❌ SHOULD BE HIDDEN" : "✅ CORRECT"}`);

    // Manually navigate by setting view through page state
    // We can click through the app - but there's no direct way without the button
    // Let's check: the app should show empty state on the film page first

    await page.screenshot({ path: "E:/tmp/empty_state.png" });
    console.log(`  Screenshot: E:/tmp/empty_state.png\n`);
    await context.close();
  }

  // ── Test 2: Cache hit (10 frames, fresh cache) ──
  console.log("=== Test 2: Cache hit ===\n");
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const frames10 = Array.from({ length: 10 }, (_, i) =>
      makeFrame(`c${i}`, `2026-04-${String(25 + i).padStart(2, "0")}`, `content ${i}`)
    );

    // Pre-seed cache
    await page.evaluate((f) => {
      localStorage.setItem("jingxi_frames", JSON.stringify(f));
      localStorage.setItem("jingxi_reflection", JSON.stringify({
        body: "缓存的回响测试内容",
        floatingWords: ["测试", "缓存", "回响"],
        generatedAt: Date.now() - 1000 * 60, // 1 minute ago
        frameCount: 10,
        spanDays: 10,
        provider: "mock",
        version: 1,
      }));
    }, frames10);

    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(1500);

    // Navigate to film → reflection
    const filmBtn = page.locator("button", { hasText: "查看时间胶片" });
    if (await filmBtn.count() > 0) await filmBtn.click();
    await page.waitForTimeout(1000);

    const rBtn = page.locator("button", { hasText: "镜子另一边" });
    if (await rBtn.count() > 0) {
      await rBtn.click();
      await page.waitForTimeout(2000);

      const text = await page.locator("body").textContent();
      const cacheHit = text.includes("缓存的回响测试内容");
      const cacheLabel = text.includes("上次的回响");
      console.log(`  Cache hit (body matches): ${cacheHit ? "✅ YES" : "❌ NO"}`);
      console.log(`  '上次的回响' label: ${cacheLabel ? "✅ YES" : "❌ NO"}`);
    }
    await page.screenshot({ path: "E:/tmp/cache_hit.png" });
    await context.close();
  }

  // ── Test 3: Cache regeneration (frame count delta >= 3) ──
  console.log("\n=== Test 3: Cache regeneration (delta 3) ===\n");
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // 13 frames, but cache says frameCount=10 → delta=3 → should regenerate
    const frames13 = Array.from({ length: 13 }, (_, i) =>
      makeFrame(`r${i}`, `2026-04-${String(20 + i).padStart(2, "0")}`, `content ${i}`)
    );

    await page.evaluate((f) => {
      localStorage.setItem("jingxi_frames", JSON.stringify(f));
      localStorage.setItem("jingxi_reflection", JSON.stringify({
        body: "旧的缓存内容 - 10帧",
        floatingWords: ["旧"],
        generatedAt: Date.now() - 1000,
        frameCount: 10,  // Old: 10 frames
        spanDays: 5,
        provider: "mock",
        version: 1,
      }));
    }, frames13);

    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(1500);

    const filmBtn = page.locator("button", { hasText: "查看时间胶片" });
    if (await filmBtn.count() > 0) await filmBtn.click();
    await page.waitForTimeout(1000);

    const rBtn = page.locator("button", { hasText: "镜子另一边" });
    if (await rBtn.count() > 0) {
      await rBtn.click();
      // Wait for API call - this will try the real API which may be slow
      await page.waitForTimeout(5000);

      const text = await page.locator("body").textContent();
      const oldCache = text.includes("旧的缓存内容");
      const isLoading = text.includes("正在读取");
      console.log(`  Old cache NOT shown (regenerating): ${!oldCache ? "✅ YES" : "❌ NO - still showing old"}`);
      console.log(`  Loading or new content: ${isLoading ? "⏳ Loading" : "✅ New content"}`);
    }
    await page.screenshot({ path: "E:/tmp/cache_regen.png" });
    await context.close();
  }

  // ── Test 4: Cache with same frame count (should hit) ──
  console.log("\n=== Test 4: No regen needed (same count, recent) ===\n");
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const frames10v2 = Array.from({ length: 10 }, (_, i) =>
      makeFrame(`s${i}`, `2026-05-${String(1 + i).padStart(2, "0")}`, `stuff ${i}`)
    );

    await page.evaluate((f) => {
      localStorage.setItem("jingxi_frames", JSON.stringify(f));
      localStorage.setItem("jingxi_reflection", JSON.stringify({
        body: "精确10帧的回响",
        floatingWords: ["精确"],
        generatedAt: Date.now() - 1000 * 60 * 60, // 1 hour ago
        frameCount: 10,  // Same as current
        spanDays: 4,
        provider: "mock",
        version: 1,
      }));
    }, frames10v2);

    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(1500);

    const filmBtn = page.locator("button", { hasText: "查看时间胶片" });
    if (await filmBtn.count() > 0) await filmBtn.click();
    await page.waitForTimeout(1000);

    const rBtn = page.locator("button", { hasText: "镜子另一边" });
    if (await rBtn.count() > 0) {
      await rBtn.click();
      await page.waitForTimeout(2000);

      const text = await page.locator("body").textContent();
      const cacheHit = text.includes("精确10帧的回响");
      console.log(`  Cache hit (same count): ${cacheHit ? "✅ YES" : "❌ NO"}`);
    }
    await context.close();
  }

  console.log("\n=== ALL CACHE TESTS DONE ===");
  await browser.close();
})();
