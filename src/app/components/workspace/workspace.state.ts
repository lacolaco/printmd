import { Injectable, signal } from '@angular/core';

/** Workspace のローカル状態。ボトムシートの開閉 */
@Injectable()
export class WorkspaceState {
  private readonly opened = signal(false);

  readonly sheetOpen = this.opened.asReadonly();

  toggle(): void {
    this.opened.update((open) => !open);
  }
}
