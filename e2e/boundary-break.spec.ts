import { expect, test } from '@playwright/test';

// 画面の強制改ページは CSS の break-before に頼らずセグメント分割で表現している
// (Firefox は段への強制改行を実装せず、Safari 安定版は break-before: column を
// 解さない)。エンジンを問わず、ファイル境界で次のファイルが新しいシートの
// 先頭から始まることを実レイアウトで検証する
// シートは可視域に入るまで実体化されないため、両シートが収まる高さで開く
test.use({ viewport: { width: 1280, height: 2600 } });

test('ファイル境界で次のファイルが新しいシートの先頭から始まる', async ({ page }) => {
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
  // 遅延実体化: 境界ブロックのシートが実体化されるまで待つ
  await page.locator('.sheet .mc [data-block-id="f1b0"]').waitFor();

  const boundary = await page.evaluate(() => {
    for (const sheet of document.querySelectorAll<HTMLElement>('.sheet')) {
      const mc = sheet.querySelector('.mc');
      const el = mc?.querySelector('[data-block-id="f1b0"]');
      if (!mc || !el) continue;
      const mcRect = mc.getBoundingClientRect();
      const rect = el.getBoundingClientRect();
      return {
        page: Number(sheet.dataset['page']),
        firstBlockId: mc.querySelector('[data-block-id]')?.getAttribute('data-block-id'),
        left: rect.left - mcRect.left,
        hasPrevFileContent: mc.querySelector('[data-block-id^="f0"]') !== null,
      };
    }
    return null;
  });

  expect(boundary).not.toBeNull();
  // 境界ブロックは自シートの先頭ブロックで、段 0 (窓の位置) に載る
  expect(boundary!.page).toBeGreaterThanOrEqual(2);
  expect(boundary!.firstBlockId).toBe('f1b0');
  expect(Math.abs(boundary!.left)).toBeLessThan(1);
  // シートのクローンは自セグメントのブロックだけを持つ
  expect(boundary!.hasPrevFileContent).toBe(false);
});
