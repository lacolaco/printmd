import { expect, test } from '@playwright/test';
import { COLUMN_STEP_MM, MM_TO_PX } from '../src/app/page-geometry';

// WebKit は break-before: column を解さない (-webkit-column-break-before で代替している)。
// フォールバックが失われるとファイル境界の改ページが消えるため、実レイアウトで検証する
test('WebKit でもファイル境界で段が改まる', async ({ page }) => {
  await page.goto('/');
  await page.setInputFiles('input[type="file"]', [
    {
      name: 'a.md',
      mimeType: 'text/markdown',
      buffer: Buffer.from(`# 一つ目\n\n${'本文の段落。'.repeat(80)}\n`, 'utf-8'),
    },
    {
      name: 'b.md',
      mimeType: 'text/markdown',
      buffer: Buffer.from('# 二つ目\n\n次のファイルの本文。\n', 'utf-8'),
    },
  ]);
  await page.locator('.sheet .mc').first().waitFor();

  const { column, topInColumn } = await page.evaluate(
    ({ columnStepPx }) => {
      const mc = document.querySelector('.sheet .mc')!;
      const el = mc.querySelector('[data-block-id="f1b0"]')!;
      const mcRect = mc.getBoundingClientRect();
      const rect = el.getBoundingClientRect();
      return {
        column: (rect.left - mcRect.left) / columnStepPx,
        topInColumn: rect.top - mcRect.top,
      };
    },
    { columnStepPx: COLUMN_STEP_MM * MM_TO_PX },
  );

  // 境界ブロックは次の段の先頭に載る (段位置が整数 = 段頭、前段からの続き位置ではない)
  expect(Math.abs(column - Math.round(column))).toBeLessThan(0.01);
  expect(Math.round(column)).toBeGreaterThanOrEqual(1);
  expect(topInColumn).toBeLessThan(30);

  // Playwright の WebKit は break-before: column を解する新しめの Safari のため、
  // レイアウト検証だけでは安定版 Safari (column 値非対応) の回帰を検出できない。
  // 安定版が頼る旧プロパティが配信 CSS の原文に残っていることを検証する
  // (computed style は新 WebKit がエイリアス解決してしまい判定にならない)
  const styleTexts = await page.evaluate(async () => {
    const links = [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')];
    const texts = await Promise.all(links.map((link) => fetch(link.href).then((r) => r.text())));
    texts.push(...[...document.querySelectorAll('style')].map((style) => style.textContent ?? ''));
    return texts;
  });
  expect(styleTexts.some((text) => text.includes('-webkit-column-break-before'))).toBe(true);
});
