import { Service, inject } from '@angular/core';
import { Manuscripts } from '../../shared/manuscript/manuscripts';
import { DemoManuscript } from './demo-manuscript';

/** デモ原稿の取り込み。同梱カタログ (public/demo/) を通常の取り込み経路へ流す */
@Service()
export class Demo {
  private readonly manuscripts = inject(Manuscripts);
  /** ガイド + 著作権消滅作品の長文 */
  private readonly catalog = ['printmd-guide.md', 'hashire-merosu.md'].map(
    (name) => new DemoManuscript(name),
  );

  load(): void {
    this.manuscripts.add(this.catalog);
  }
}
