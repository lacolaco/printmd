import { Service } from '@angular/core';
import type { FileFragment } from '../markdown/block';
import type { ManuscriptFile } from './manuscript';

/**
 * ファイル内容 → mermaid 適用済み HTML のキャッシュ。世代管理と追い出しを閉じる。
 * mermaid 待ちの間に params が変わると複数の loader が重なり、遅れて解決した
 * 古い loader が古い keep 集合でキャッシュを追い出す競合がある (現行文書の
 * エントリを消して結果を壊す)。追い出しは最新世代だけが行う
 */
@Service()
export class FragmentCache {
  private readonly entries = new Map<string, string>();
  private epoch = 0;

  /** 変換の 1 世代を開始し、追い出し判定に使う世代番号を返す */
  begin(): number {
    return ++this.epoch;
  }

  /** この内容の断片が変換済みか */
  isCached(content: string): boolean {
    return this.entries.has(content);
  }

  /** 変換済み断片を内容をキーに保存する */
  put(content: string, html: string): void {
    this.entries.set(content, html);
  }

  /** 古い loader は最新世代の追い出しでエントリを失い得るが、その結果は resource が捨てる */
  fragmentFor(file: ManuscriptFile, fileIndex: number): FileFragment {
    return { fileIndex, fileName: file.name, html: this.entries.get(file.content) ?? '' };
  }

  /** 世代が最新のままなら、keep に無い断片を追い出す */
  evict(epoch: number, keep: ReadonlySet<string>): void {
    if (epoch === this.epoch) {
      this.prune(keep);
    }
  }

  private prune(keep: ReadonlySet<string>): void {
    for (const key of this.entries.keys()) {
      this.drop(keep, key);
    }
  }

  private drop(keep: ReadonlySet<string>, key: string): void {
    if (!keep.has(key)) {
      this.entries.delete(key);
    }
  }
}
