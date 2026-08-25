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
 * 表示操作の帯は広い幅では中央へ絶対配置され、狭い幅では通常フローへ戻る。
 * 入りきらない分は帯の中で横スクロールさせ、印刷ボタンへ被せない。
 * 検証は幾何位置ではなく当たり判定で行う (覆われた操作面は別の操作を誤爆させる)
 */
for (const width of [320, 375]) {
  test(`${width}px 幅でヘッダの操作面が互いに覆い合わない`, async ({ page }) => {
    await page.setViewportSize({ width, height: 700 });
    await page.goto('/');
    await importMarkdown(page, 'header.md', '# 見出し\n\n本文である。');

    const overlaps = await page.evaluate(() => {
      const selectors = [
        '.app-logo',
        'header select',
        '[aria-label="縮小"]',
        '[aria-label="拡大"]',
        '.app-print-button',
      ];
      const band = document.querySelector('header [role="status"]')!.parentElement!;
      const scrollport = band.getBoundingClientRect();
      // 帯が内容を切り取るときだけ、はみ出した分はスクロールで到達する。
      // 切り取らない (overflow: visible) なら、はみ出しはそのまま隣へ被さる
      const clips = getComputedStyle(band).overflowX !== 'visible';
      const visibleRect = (el: Element) => {
        const box = el.getBoundingClientRect();
        const clipped = clips && band.contains(el);
        return {
          left: clipped ? Math.max(box.left, scrollport.left) : box.left,
          right: clipped ? Math.min(box.right, scrollport.right) : box.right,
        };
      };
      const rects = selectors.map((selector) => ({
        selector,
        ...visibleRect(document.querySelector(selector)!),
      }));
      return rects.flatMap((a, index) =>
        rects
          .slice(index + 1)
          .filter((b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0.5)
          .map((b) => `${a.selector} × ${b.selector}`),
      );
    });
    expect(overlaps).toEqual([]);

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
