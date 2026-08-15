import type { Page } from '@playwright/test';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { COLUMN_STEP_MM, MM_TO_PX } from '../src/app/page-geometry';

/** Markdown 文字列をファイル入力へ流し込み、プレビューの構築を待つ */
export async function importMarkdown(page: Page, name: string, content: string): Promise<void> {
  await page.setInputFiles('input[type="file"]', {
    name,
    mimeType: 'text/markdown',
    buffer: Buffer.from(content, 'utf-8'),
  });
  await page.locator('.sheet').first().waitFor();
}

/** ツールバーのページ数表示を数値で返す */
export async function readPageCount(page: Page): Promise<number> {
  const text = await page.locator('[role="toolbar"] [role="status"]').textContent();
  const match = /(\d+)ページ/.exec(text ?? '');
  if (!match) throw new Error(`ページ数表示が読めない: ${text}`);
  return Number(match[1]);
}

/**
 * プレビューの段組ジオメトリから、各 h2 見出しテキストが載るページ番号を返す。
 * マスターの複製を計測用に組み、段のインデックスを x 位置から割り出す
 */
export async function previewHeadingPages(page: Page): Promise<Record<string, number>> {
  return page.evaluate(({ columnStepPx }) => {
    const doc = document.querySelector('.print-root > *');
    if (!doc) throw new Error('印刷対象が存在しない');
    const probe = document.createElement('div');
    probe.className = 'preview-probe';
    const mc = doc.cloneNode(true) as HTMLElement;
    mc.className = 'mc markdown-body';
    probe.append(mc);
    document.body.append(probe);
    const base = mc.getBoundingClientRect().left;
    const pages: Record<string, number> = {};
    mc.querySelectorAll('h2').forEach((h) => {
      const rect = h.getBoundingClientRect();
      pages[h.textContent?.trim() ?? ''] = Math.round((rect.left - base) / columnStepPx) + 1;
    });
    probe.remove();
    return pages;
  }, { columnStepPx: COLUMN_STEP_MM * MM_TO_PX });
}

/** 印刷実出力 (page.pdf) の各ページのテキストを返す */
export async function printPdfPageTexts(page: Page): Promise<string[]> {
  const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
  const doc = await getDocument({ data: new Uint8Array(pdf) }).promise;
  const texts: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const content = await (await doc.getPage(i)).getTextContent();
    texts.push(content.items.map((item) => ('str' in item ? item.str : '')).join(''));
  }
  return texts;
}
