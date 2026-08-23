import { CdkDrag, CdkDropList, type CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, ElementRef, Injector, inject } from '@angular/core';
import { Editor } from '../../../editor';
import { ManuscriptState } from '../../../../state/manuscript-state';
import { Announcer } from './announcer';
import { FileAddInput } from './file-add-input';
import { FileRowItem } from './file-row-item';
import { focusLater } from './move-focus';

/**
 * 原稿ファイルの取り込みと並べ替え。並べ替えはドラッグとキーボード
 * (上へ/下へボタン) の両方に対応する。ファイル境界 = 強制改ページなので、
 * 順序は紙面に直結する
 */
@Component({
  selector: 'app-file-panel',
  imports: [CdkDrag, CdkDropList, FileAddInput, FileRowItem],
  providers: [Announcer],
  template: `
    <section aria-label="原稿ファイル">
      <ul class="space-y-1" role="list" cdkDropList (cdkDropListDropped)="onListDrop($event)">
        @for (file of store.files(); track file.id; let i = $index; let last = $last) {
          <li>
            <app-file-row-item
              cdkDrag
              [file]="file"
              [first]="i === 0"
              [last]="last"
              (moved)="move(file.id, file.name, $event)"
              (removed)="editor.removeFile(file.id)"
            />
          </li>
        }
      </ul>
      <app-file-add-input (selected)="editor.addFiles($event)" />

      @if (store.warnings().length > 0) {
        <ul class="mt-2 space-y-1" role="status">
          @for (warning of store.warnings(); track warning) {
            <li class="rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-700">{{ warning }}</li>
          }
        </ul>
      }
      <p class="sr-only" role="status" aria-live="polite">{{ announcer.message() }}</p>
    </section>
  `,
})
export class FilePanel {
  protected readonly store = inject(ManuscriptState);
  protected readonly editor = inject(Editor);
  protected readonly announcer = inject(Announcer);
  private readonly elementRef: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly injector = inject(Injector);

  protected onListDrop(event: CdkDragDrop<unknown>): void {
    if (this.editor.isReorderable(event.previousIndex, event.currentIndex)) {
      this.editor.reorder(event.previousIndex, event.currentIndex);
      this.announcer.moved(this.store.files()[event.currentIndex].name, event.currentIndex);
    }
  }

  protected move(id: number, name: string, delta: -1 | 1): void {
    if (this.editor.isMovable(id, delta)) {
      this.editor.nudge(id, delta);
      const index = this.store.files().findIndex((file) => file.id === id);
      this.announcer.moved(name, index);
      focusLater(this.injector, this.elementRef.nativeElement, id, delta);
    }
  }
}
