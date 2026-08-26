import { expect, test } from '@playwright/test';
import {
  importMarkdown,
  previewHeadingPages,
  printPdfPageSize,
  printPdfPageTexts,
  readPageCount,
  selectPaper,
  sheetSizePx,
} from './support';
import { toPx } from '../src/app/shared/paper/units';
import { PAPERS } from '../src/app/shared/paper/paper-catalog';

/**
 * 中核保証の検証: プレビューが見せるページ割りと、印刷 (PDF 化) の実出力が
 * 同一であること。段落のページ跨ぎ・強制改ページ・混合ブロックを含む原稿で、
 * 全 h2 見出しの「載るページ番号」をプレビューと実 PDF の双方から取り出して
 * 突き合わせる。選べる用紙書式のすべてで成り立たなければならない。
 */

function buildManuscript(): string {
  const md = ['# 印刷一致検証', ''];
  for (let s = 1; s <= 10; s++) {
    md.push(`## 節 ${s}`, '');
    md.push(
      '印刷とプレビューの一致を検証する本文の段落である。日本語の文章を並べて高さを作る。'.repeat(
        7,
      ),
      '',
    );
    if (s === 3) md.push('```ts', 'const x: number = 42;', '```', '');
    if (s === 5) md.push('| 列 A | 列 B |', '| --- | --- |', '| a | b |', '');
    if (s === 7) md.push('- [x] 完了タスク', '- [ ] 未完了タスク', '');
    md.push(
      '続きの段落である。ページをまたぐ自然な改ページを起こすための本文を続ける。'.repeat(6),
      '',
    );
  }
  return md.join('\n');
}

for (const paper of PAPERS.items) {
  test(`プレビューのページ割りが印刷 PDF と一致する (強制改ページ込み・${paper.label})`, async ({
    page,
  }) => {
    await page.goto('/');
    await importMarkdown(page, 'parity.md', buildManuscript());
    await selectPaper(page, paper);

    // 節 6 の直前に強制改ページを入れる (ページ数が変わるかは原稿の割り付け次第
    // なので、待機条件はマスターへのクラス付与とプレビュー再構築にする)
    await page
      .locator('app-break-panel label', { hasText: '節 6' })
      .locator('input[type="checkbox"]')
      .check();
    await expect(page.locator('.print-root .forced-break')).toHaveCount(1);
    await expect(page.locator('.sheet').first()).toBeAttached();

    const previewCount = await readPageCount(page);
    const previewPages = await previewHeadingPages(page, paper);

    const pdfTexts = await printPdfPageTexts(page);
    expect(pdfTexts.length).toBe(previewCount);

    // 実 PDF 側の各見出しの初出ページ
    const printPages: Record<string, number> = {};
    pdfTexts.forEach((text, index) => {
      const normalized = text.replaceAll(/\s+/g, '');
      for (let s = 1; s <= 10; s++) {
        const key = `節 ${s}`;
        if (!(key in printPages) && normalized.includes(`節${s}`)) printPages[key] = index + 1;
      }
    });

    expect(printPages).toEqual(previewPages);

    // 強制改ページ先はページ先頭 (= その見出しでページが始まる)
    const forcedPage = previewPages['節 6'];
    expect(pdfTexts[forcedPage - 1].replaceAll(/\s+/g, '').startsWith('節6')).toBe(true);
  });
}

test('選んだ用紙書式が画面と印刷 PDF の紙寸法になる', async ({ page }) => {
  await page.goto('/');
  await importMarkdown(page, 'size.md', '# 用紙\n\n本文である。\n');
  for (const paper of PAPERS.items) {
    await selectPaper(page, paper);
    expect(await printPdfPageSize(page)).toEqual({
      width: paper.page.width,
      height: paper.page.height,
    });
    const sheet = await sheetSizePx(page);
    expect(sheet.width).toBeCloseTo(toPx(paper.page.width), -1);
    expect(sheet.height).toBeCloseTo(toPx(paper.page.height), -1);
  }
});

test('GitHub 体裁の要素が描画される', async ({ page }) => {
  await page.goto('/');
  await importMarkdown(
    page,
    'style.md',
    '# 体裁\n\n`inline` と **強調**。\n\n- 箇条書きの項目\n\n```ts\nconst x = 1;\n```\n\n- [x] タスク\n\n```mermaid\ngraph LR; A-->B;\n```\n',
  );
  const doc = page.locator('.print-root > *');
  await expect(doc.locator('code .hljs-keyword').first()).toBeAttached();
  await expect(doc.locator('li.task-list-item input[type="checkbox"]')).toBeChecked();
  await expect(doc.locator('figure.mermaid svg')).toBeAttached();
  // Tailwind preflight に消されがちな箇条書きマーカーの回帰検査
  const listStyle = await page.evaluate(() => {
    const ul = document.querySelector('.print-root ul:not(:has(.task-list-item))');
    return ul ? getComputedStyle(ul).listStyleType : null;
  });
  expect(listStyle).toBe('disc');
});
