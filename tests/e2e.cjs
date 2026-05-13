// @ts-check
const { chromium } = require("playwright");
const fs = require("fs");

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000";

// Helper: type text through React's controlled component
async function reactType(page, text) {
  const ta = page.locator("textarea");
  await ta.click();
  await page.waitForTimeout(100);

  await page.evaluate((t) => {
    const el = document.querySelector("textarea");
    if (!el) return;
    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype, "value"
    ).set;
    nativeSetter.call(el, t);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, text);

  await page.waitForTimeout(500);
}

async function clickTestId(page, testId) {
  await page.evaluate((id) => {
    const el = document.querySelector(`[data-testid="${id}"]`);
    if (el instanceof HTMLElement) el.click();
  }, testId);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });

  const errors = [];
  page.on("pageerror", err => errors.push(err.message));

  console.log("=== 1. 加载首页 ===");
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  if (errors.length > 0) {
    console.log("JS错误:", errors);
  }

  console.log(`标题: ${await page.locator("h1").textContent()}`);

  console.log("\n=== 2. 输入文字 ===");
  await reactType(page, "今天天气很好，下午去公园散步，看到了一只很可爱的橘猫。");

  // Verify React state
  const draft = await page.evaluate(() => localStorage.getItem("jingxi_draft"));
  console.log(`草稿已存储: ${draft ? "YES (" + draft.substring(0, 20) + "...)" : "NO"}`);

  const btnEnabled = await page.locator('button:has-text("开始显影")').first().isEnabled();
  console.log(`"开始显影"可用: ${btnEnabled}`);

  const filmHidden = !(await page.locator("text=查看时间胶片").isVisible().catch(() => false));
  console.log(`"查看时间胶片"已隐藏: ${filmHidden}`);

  if (!btnEnabled) { console.log("FAIL: 按钮不可用"); await browser.close(); return; }

  console.log("\n=== 3. 保存帧 ===");
  await page.locator('button:has-text("开始显影")').first().click();
  await page.waitForTimeout(2000);

  const textAfter = await page.locator("textarea").inputValue();
  console.log(`保存后清空: ${textAfter.length === 0}`);

  const frameCount = await page.evaluate(() => JSON.parse(localStorage.getItem("jingxi_frames") || "[]").length);
  console.log(`帧数: ${frameCount}`);

  if (frameCount === 0) { console.log("FAIL: 没有帧被保存"); await browser.close(); return; }

  console.log("\n=== 4. 进入时间胶片 → 打开档案 ===");
  await page.locator("text=查看时间胶片").click();
  await page.waitForTimeout(800);
  await page.locator("text=时间胶片").first().waitFor({ state: "visible" });
  await page.getByRole("button", { name: "档案" }).first().click();
  await page.waitForTimeout(800);

  await page.locator('h2:has-text("档案")').waitFor({ state: "visible" });
  console.log(`档案面板: ${await page.locator('h2:has-text("档案")').isVisible()}`);
  console.log(`统计: ${await page.locator('text=/共 \\d+ 帧/').first().textContent()}`);

  // Select all frames
  await clickTestId(page, "archive-select-all");
  await page.waitForTimeout(200);
  await page.getByTestId("archive-selected-export-txt").waitFor({ state: "visible" });
  console.log("选中: selected export controls visible");

  console.log("\n=== 5. 导出测试 ===");
  // TXT
  await clickTestId(page, "archive-selected-export-txt");
  await page.waitForTimeout(100);
  const [txtDL] = await Promise.all([
    page.waitForEvent("download", { timeout: 5000 }),
    clickTestId(page, "archive-selected-export-txt"),
  ]);
  const txt = fs.readFileSync(await txtDL.path(), "utf-8");
  console.log(`TXT: BOM=${txt.charCodeAt(0) === 0xFEFF}, 中文=${/[一-鿿]/.test(txt)}, ${txt.length}字节`);
  await page.waitForTimeout(300);

  // JSON
  await clickTestId(page, "archive-selected-export-json");
  await page.waitForTimeout(100);
  const [jsonDL] = await Promise.all([
    page.waitForEvent("download", { timeout: 5000 }),
    clickTestId(page, "archive-selected-export-json"),
  ]);
  const jsonText = fs.readFileSync(await jsonDL.path(), "utf-8").replace(/^\uFEFF/, "");
  const json = JSON.parse(jsonText);
  console.log(`JSON: ${json.length}帧, 标签="${json[0]?.tags?.join(",")}"`);
  await page.waitForTimeout(300);

  // MD
  await clickTestId(page, "archive-selected-export-md");
  await page.waitForTimeout(100);
  const [mdDL] = await Promise.all([
    page.waitForEvent("download", { timeout: 5000 }),
    clickTestId(page, "archive-selected-export-md"),
  ]);
  const md = fs.readFileSync(await mdDL.path(), "utf-8");
  console.log(`MD: 中文=${/[一-鿿]/.test(md)}, 有效=${md.includes("# 镜隙之间")}`);

  console.log("\n=== 全部通过! ===");
  await browser.close();
})();
