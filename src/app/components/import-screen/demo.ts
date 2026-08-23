import { Service, inject } from '@angular/core';
import { Editor } from '../editor';
import { DemoManuscript } from './demo-manuscript';

/** デモ原稿の取り込み。同梱カタログ (public/demo/) を通常の取り込み経路へ流す */
@Service()
export class Demo {
  private readonly editor = inject(Editor);
  /** ガイド + 著作権消滅作品の長文 */
  private readonly catalog = ['printmd-guide.md', 'hashire-merosu.md'].map(
    (name) => new DemoManuscript(name),
  );

  load(): void {
    this.editor.addFiles(this.catalog);
  }
}
