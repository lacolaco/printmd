import { expect, type Page } from '@playwright/test';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { MM_TO_PX, type PaperFormat } from '../src/app/shared/paper/paper-format';

/** Markdown 文字列をファイル入力へ流し込み、プレビューの構築を待つ */
export async function importMarkdown(page: Page, name: string, content: string): Promise<void> {
  await page.setInputFiles('input[type="file"]', {
    name,
    mimeType: 'text/markdown',
    buffer: Buffer.from(content, 'utf-8'),
  });
  await page.locator('.sheet').first().waitFor();
}

/**
 * ヘッダの用紙セレクタで書式を選び、紙面の再構築を待つ。
 * 待機条件は再描画後のシートの実寸にする (CSS 変数は状態の更新より先に書かれるため、
 * それを待っても古いシートのまま返りうる)。セレクタと Paper の結線は単体テストが持つ
 */
export async function selectPaper(page: Page, paper: PaperFormat): Promise<void> {
  await page.selectOption('header select', paper.id);
  await expect(page.locator('header select')).toHaveValue(paper.id);
  await expect.poll(() => sheetWidthPx(page)).toBeCloseTo(paper.page.width * MM_TO_PX, -1);
}

/** 1 枚目のシートの、表示倍率を戻した実寸 (CSS px) */
async function sheetWidthPx(page: Page): Promise<number> {
  return page.evaluate(() => {
    const sheet = document.querySelector('.sheet');
    if (sheet === null) return 0;
    const zoom = Number(getComputedStyle(sheet.parentElement!).zoom) || 1;
    return sheet.getBoundingClientRect().width / zoom;
  });
}

/** ツールバーのページ数表示を数値で返す */
export async function readPageCount(page: Page): Promise<number> {
  const text = await page.locator('header [role="status"]').textContent();
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
      probe.className = 'preview-probe';
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
    { columnStepPx: paper.step * MM_TO_PX, columnGapPx: paper.gap * MM_TO_PX },
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
