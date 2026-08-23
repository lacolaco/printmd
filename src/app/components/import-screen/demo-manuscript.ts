import type { ImportSource } from '../../manuscript/manuscript';

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
