import { expect, type Page } from '@playwright/test';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { toPx } from '../src/app/shared/paper/units';
import type { PaperFormat } from '../src/app/shared/paper/paper-format';
import { PAPERS } from '../src/app/shared/paper/paper-catalog';

/** Markdown 文字列をファイル入力へ流し込み、プレビューの構築を待つ */
export async function importMarkdown(page: Page, name: string, content: string): Promise<void> {
  await page.setInputFiles('input[type="file"]', {
    name,
    mimeType: 'text/markdown',
    buffer: Buffer.from(content, 'utf-8'),
  });
  // 遅延実体化なので、枠だけでなく中身が入るまで待つ
  await page.locator('.sheet .clip .mc').first().waitFor();
}

/**
 * ツールバーの用紙ボタンで書式を選び、紙面が組み直されるまで待つ。
 * 既に目的の書式が選ばれていて別の書式があるなら、結線を毎回踏むためにそこを経由する
 */
export async function selectPaper(page: Page, paper: PaperFormat): Promise<void> {
  const detour = PAPERS.find((other) => other !== paper);
  if (detour !== undefined && (await labelOf(page)) === paper.label) {
    await switchTo(page, detour);
  }
  if ((await labelOf(page)) !== paper.label) {
    await switchTo(page, paper);
  }
}

async function labelOf(page: Page): Promise<string> {
  const checked = page.locator('[aria-label="表示設定"] [role="radio"][aria-checked="true"]');
  return (await checked.textContent())?.trim() ?? '';
}

/** 寸法は CSS 変数だけで先に変わるため、シートが差し替わったことを関門にする */
async function switchTo(page: Page, paper: PaperFormat): Promise<void> {
  await page.evaluate(() =>
    document.querySelectorAll('.sheet').forEach((sheet) => sheet.setAttribute('data-stale', '')),
  );
  await page.getByRole('radio', { name: paper.label }).click();
  await expect(page.getByRole('radio', { name: paper.label })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect.poll(() => page.locator('.sheet[data-stale]').count()).toBe(0);
  await page.locator('.sheet .clip .mc').first().waitFor();
  await expect
    .poll(async () => (await sheetSizePx(page)).width)
    .toBeCloseTo(toPx(paper.page.width), -1);
}

/** 1 枚目のシートの、表示倍率を戻した実寸 (CSS px) */
export async function sheetSizePx(page: Page): Promise<{ width: number; height: number }> {
  return page.evaluate(() => {
    const sheet = document.querySelector('.sheet');
    if (sheet === null) return { width: 0, height: 0 };
    const zoom = Number(getComputedStyle(sheet.parentElement!).zoom) || 1;
    const box = sheet.getBoundingClientRect();
    return { width: box.width / zoom, height: box.height / zoom };
  });
}

/** ツールバーのページ数表示を数値で返す */
export async function readPageCount(page: Page): Promise<number> {
  const text = await page.locator('[aria-label="表示設定"] [role="status"]').textContent();
  const match = /(\d+)ページ/.exec(text ?? '');
  if (!match) throw new Error(`ページ数表示が読めない: ${text}`);
  return Number(match[1]);
}

/**
 * プレビューの段組ジオメトリから、各 h2 見出しテキストが載るページ番号を返す。
 * アプリと同じセグメント分割 (強制改ページのクラス位置で独立ストリップに分ける)
 * を印刷対象の複製へ適用し、段のインデックスを x 位置から割り出す
 */
export async function previewHeadingPages(
  page: Page,
  paper: PaperFormat,
): Promise<Record<string, number>> {
  return page.evaluate(
    ({ columnStepPx, columnGapPx }) => {
      const doc = document.querySelector('.print-root > *');
      if (!doc) throw new Error('印刷対象が存在しない');
      const groups: Element[][] = [[]];
      [...doc.children].forEach((el) => {
        if (el.classList.contains('forced-break') && groups[groups.length - 1].length > 0) {
          groups.push([]);
        }
        groups[groups.length - 1].push(el);
      });
      const probe = document.createElement('div');
      probe.className = 'measuring-area';
      const clones = groups.map((group, index) => {
        const mc = doc.cloneNode(false) as HTMLElement;
        mc.className = 'mc markdown-body';
        const parent = index === 0 ? mc : document.createElement('div');
        group.forEach((el) => parent.append(el.cloneNode(true)));
        if (parent !== mc) mc.append(parent);
        probe.append(mc);
        return mc;
      });
      document.body.append(probe);
      const pages: Record<string, number> = {};
      let firstPage = 0;
      clones.forEach((mc) => {
        const base = mc.getBoundingClientRect().left;
        mc.querySelectorAll('h2').forEach((h) => {
          const rect = h.getBoundingClientRect();
          pages[h.textContent?.trim() ?? ''] =
            firstPage + Math.round((rect.left - base) / columnStepPx) + 1;
        });
        firstPage += Math.max(1, Math.round((mc.scrollWidth + columnGapPx) / columnStepPx));
      });
      probe.remove();
      return pages;
    },
    { columnStepPx: toPx(paper.step), columnGapPx: toPx(paper.gap) },
  );
}

/** 印刷実出力 (page.pdf) の 1 ページ目の紙寸法 (mm) を返す */
export async function printPdfPageSize(page: Page): Promise<{ width: number; height: number }> {
  const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
  const doc = await getDocument({ data: new Uint8Array(pdf) }).promise;
  const [x0, y0, x1, y1] = (await doc.getPage(1)).view;
  const toMm = (pt: number) => Math.round((pt * 25.4) / 72);
  return { width: toMm(x1 - x0), height: toMm(y1 - y0) };
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
