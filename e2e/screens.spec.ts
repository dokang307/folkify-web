import path from "node:path";
import { mockApi, signIn, test } from "./fixtures";

// Chụp màn hình để review thiết kế bằng mắt. Chỉ chạy khi đặt SCREENSHOT_DIR.
const DIR = process.env.SCREENSHOT_DIR;
test.skip(!DIR, "set SCREENSHOT_DIR to capture screenshots");

const PAGES = [
  { name: "home", url: "/" },
  { name: "instrument", url: "/instruments/dan-tranh" },
  { name: "lesson", url: "/instruments/dan-tranh/lessons/dt-02" },
  { name: "practice", url: "/practice?instrument=dan-tranh&song=s-1" },
  { name: "result", url: "/practice/results/p-1" },
  { name: "pricing", url: "/pricing" },
];

for (const scheme of ["light", "dark"] as const) {
  test(`screens ${scheme}`, async ({ page }, info) => {
    await page.emulateMedia({ colorScheme: scheme });
    await mockApi(page, "BASIC");
    await signIn(page, "BASIC");
    for (const p of PAGES) {
      await page.goto(p.url);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(DIR!, `${info.project.name}-${scheme}-${p.name}.png`), fullPage: true });
    }
  });
}

test("screen login", async ({ page }, info) => {
  await page.goto("/login");
  await page.screenshot({ path: path.join(DIR!, `${info.project.name}-login.png`) });
});
