import { Injectable, inject, signal, type Signal } from '@angular/core';
import { Manuscripts } from '../../shared/manuscript/manuscripts';
import type { ImportSource } from '../../shared/manuscript/manuscript';

/** Workspace のビューモデル。ボトムシートの開閉状態と、ドロップ取り込みの命令 */
@Injectable()
export class WorkspaceViewModel {
  private readonly manuscripts = inject(Manuscripts);
  private readonly opened = signal(false);

  readonly sheetOpen: Signal<boolean> = this.opened.asReadonly();

  toggle(): void {
    this.opened.update((open) => !open);
  }

  add(sources: readonly ImportSource[]): Promise<void> {
    return this.manuscripts.add(sources);
  }
}
