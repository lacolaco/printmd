import type { ImportSource } from '../../shared/manuscript/import-source';

/** デモ原稿 1 冊。それ自体が取り込み入力 (ImportSource) として振る舞う */
export class DemoManuscript implements ImportSource {
  constructor(readonly name: string) {}

  async text(): Promise<string> {
    const response = await fetch(`/demo/${this.name}`);
    this.assert(response.ok);
    return response.text();
  }

  private assert(ok: boolean): void {
    if (!ok) {
      throw new Error(`demo fetch failed: ${this.name}`);
    }
  }
}

/** 同梱デモの一式: ガイド + 著作権消滅作品の長文 (public/demo/) */
export const BUNDLED_DEMOS: readonly DemoManuscript[] = [
  'printmd-guide.md',
  'hashire-merosu.md',
].map((name) => new DemoManuscript(name));
