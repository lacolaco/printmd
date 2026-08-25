import { Injectable, inject, signal, type Signal } from '@angular/core';
import { Manuscripts } from '../../shared/manuscript/manuscripts';
import type { ImportSource } from '../../shared/manuscript/manuscript';

/** Workspace のビューモデル。ボトムシートの開閉状態と、ドロップ取り込みの命令 */
@Injectable()
export class WorkspaceViewModel {
  private readonly manuscripts = inject(Manuscripts);
  private readonly isShown = signal(false);

  /** ボトムシート (調整パネル) が開いているか */
  readonly isSheetOpen: Signal<boolean> = this.isShown.asReadonly();

  /** ボトムシートの開閉を反転する */
  toggle(): void {
    this.isShown.update((open) => !open);
  }

  /** 作業画面へのドロップを原稿として取り込む */
  add(sources: readonly ImportSource[]): Promise<void> {
    return this.manuscripts.add(sources);
  }
}
