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

  const zoomIn = page.locator('[aria-label^="倍率"][aria-label$="を上げる"]');
  for (let i = 0; i < 3; i++) await zoomIn.click();
  await expect(page.locator('[role="toolbar"]')).toContainText('200%');

  // 文書全体は横に溢れない
  const docScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(docScrollWidth).toBeLessThanOrEqual(1280);
  // パネルは画面内
  const panel = page.locator('#control-panel-sheet');
  const box = (await panel.boundingBox())!;
  expect(box.x + box.width).toBeLessThanOrEqual(1280);
  // 紙面はスクローラ内で横スクロールになる
  const hasHScroll = await page.evaluate(() => {
    const scroller = document.querySelector('.app-workspace')!;
    return scroller.scrollWidth > scroller.clientWidth;
  });
  expect(hasHScroll).toBe(true);
});

/**
 * 表示操作の帯 (ヘッダ直下、プレビュー直上) は 1 行に入らなければ折り返し、
 * 操作面を隠したり互いに被せたりしない
 */
for (const width of [320, 375]) {
  test(`${width}px 幅で帯の操作面が隠れず互いに覆い合わない`, async ({ page }) => {
    await page.setViewportSize({ width, height: 700 });
    await page.goto('/');
    await importMarkdown(page, 'header.md', '# 見出し\n\n本文である。');

    const layout = await page.evaluate(() => {
      const selectors = [
        '.app-logo',
        '.app-print-button',
        '[role="toolbar"] [role="status"]',
        '[aria-label^="用紙"][aria-label$="を前へ"]',
        '[aria-label^="用紙"][aria-label$="を次へ"]',
        '[aria-label^="倍率"][aria-label$="を下げる"]',
        '[aria-label^="倍率"][aria-label$="を上げる"]',
      ];
      const band = document.querySelector('[role="toolbar"]')!;
      const rects = selectors.map((selector) => ({
        selector,
        box: document.querySelector(selector)!.getBoundingClientRect(),
      }));
      const overlaps = rects.flatMap((a, index) =>
        rects
          .slice(index + 1)
          .filter(
            (b) =>
              Math.min(a.box.right, b.box.right) - Math.max(a.box.left, b.box.left) > 0.5 &&
              Math.min(a.box.bottom, b.box.bottom) - Math.max(a.box.top, b.box.top) > 0.5,
          )
          .map((b) => `${a.selector} × ${b.selector}`),
      );
      const clipped = rects
        .filter(({ box }) => box.left < 0 || box.right > window.innerWidth || box.width === 0)
        .map(({ selector }) => selector);
      return { overlaps, clipped, spill: band.scrollWidth - band.clientWidth };
    });

    expect(layout.overlaps).toEqual([]);
    expect(layout.clipped).toEqual([]);
    expect(layout.spill).toBeLessThanOrEqual(0);

    const docScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(docScrollWidth).toBeLessThanOrEqual(width);
  });
}

test('375px 幅でもフッタの表記が帯の内側に収まる', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 });
  await page.goto('/');
  await expect(page.locator('.app-footer')).toBeVisible();

  const docScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(docScrollWidth).toBeLessThanOrEqual(375);

  const band = (await page.locator('.app-footer').boundingBox())!;
  for (const link of await page.locator('.app-footer a').all()) {
    const box = (await link.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(band.x);
    expect(box.x + box.width).toBeLessThanOrEqual(band.x + band.width);
    expect(box.y + box.height).toBeLessThanOrEqual(band.y + band.height + 1);
  }
});

test('375px 幅でフッタを折り返しても行頭に区切りが来ない', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 });
  await page.goto('/');
  await expect(page.locator('.app-footer')).toBeVisible();

  const lineHeads = await page.evaluate(() => {
    const target = document.querySelector('.app-footer p')!;
    const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
    const byTop = new Map<number, string>();
    for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
      const text = node.textContent!;
      for (let i = 0; i < text.length; i++) {
        if (text[i].trim() === '') continue;
        const range = document.createRange();
        range.setStart(node, i);
        range.setEnd(node, i + 1);
        const top = Math.round(range.getBoundingClientRect().top);
        if (!byTop.has(top)) byTop.set(top, text[i]);
      }
    }
    return [...byTop.values()];
  });

  expect(lineHeads.length).toBeGreaterThan(1);
  expect(lineHeads).not.toContain('・');
});
