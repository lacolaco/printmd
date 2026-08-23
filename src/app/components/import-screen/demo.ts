import { Service, inject } from '@angular/core';
import { EditorStore } from '../../state/editor-store';
import { DemoManuscript } from './demo-manuscript';

/** デモ原稿の取り込み。同梱カタログ (public/demo/) を通常の取り込み経路へ流す */
@Service()
export class Demo {
  private readonly store = inject(EditorStore);
  /** ガイド + 著作権消滅作品の長文 */
  private readonly catalog = ['printmd-guide.md', 'hashire-merosu.md'].map(
    (name) => new DemoManuscript(name),
  );

  load(): void {
    this.store.addFiles(this.catalog);
  }
}
