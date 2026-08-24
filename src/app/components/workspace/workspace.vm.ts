import { Injectable, signal } from '@angular/core';

/** Workspace のビューモデル。ボトムシートの開閉状態を保有する */
@Injectable()
export class WorkspaceViewModel {
  private readonly opened = signal(false);

  readonly sheetOpen = this.opened.asReadonly();

  toggle(): void {
    this.opened.update((open) => !open);
  }
}
