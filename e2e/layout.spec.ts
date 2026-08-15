import { expect, test } from '@playwright/test';
import { importMarkdown } from './support';

/**
 * レイアウト崩れの回帰検査。ズームで紙面が主エリアより広くなっても、
 * 行レイアウトが溢れずパネルが画面内に残ること (main の min-w-0 の担保)
 */
test('狭い画面 + 200% ズームでもパネルが画面外へ押し出されない', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  await importMarkdown(page, 'layout.md', '# A\n\n' + '本文の段落である。'.repeat(200));

  const zoomIn = page.locator('[aria-label="拡大"]');
  for (let i = 0; i < 3; i++) await zoomIn.click();
  await expect(page.locator('header')).toContainText('200%');

  // 文書全体は横に溢れない
  const docScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(docScrollWidth).toBeLessThanOrEqual(1280);
  // パネルは画面内
  const panel = page.locator('app-control-panel');
  const box = (await panel.boundingBox())!;
  expect(box.x + box.width).toBeLessThanOrEqual(1280);
  // 紙面はスクローラ内で横スクロールになる
  const hasHScroll = await page.evaluate(() => {
    const scroller = document.querySelector('.app-workspace')!;
    return scroller.scrollWidth > scroller.clientWidth;
  });
  expect(hasHScroll).toBe(true);
});
