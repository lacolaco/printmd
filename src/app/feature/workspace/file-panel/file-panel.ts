import { CdkDrag, CdkDropList, type CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, ElementRef, Injector, inject } from '@angular/core';
import { FilePanelViewModel } from './file-panel.vm';
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
  providers: [FilePanelViewModel],
  template: `
    <section aria-label="原稿ファイル">
      <ul class="space-y-1" role="list" cdkDropList (cdkDropListDropped)="onListDrop($event)">
        @for (file of vm.files(); track file.id; let i = $index; let last = $last) {
          <li>
            <app-file-row-item
              cdkDrag
              [file]="file"
              [isFirst]="i === 0"
              [isLast]="last"
              (moved)="move(file.id, file.name, $event)"
              (removed)="vm.remove(file.id)"
            />
          </li>
        }
      </ul>
      <app-file-add-input (selected)="vm.add($event)" />

      @if (vm.warnings().length > 0) {
        <ul class="mt-2 space-y-1" role="status">
          @for (warning of vm.warnings(); track warning) {
            <li class="rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-700">{{ warning }}</li>
          }
        </ul>
      }
      <p class="sr-only" role="status" aria-live="polite">{{ vm.message() }}</p>
    </section>
  `,
})
export class FilePanel {
  protected readonly vm = inject(FilePanelViewModel);
  private readonly elementRef: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly injector = inject(Injector);

  protected onListDrop(event: CdkDragDrop<unknown>): void {
    this.vm.reorder(event.previousIndex, event.currentIndex);
  }

  protected move(id: number, name: string, delta: -1 | 1): void {
    this.vm.move(id, name, delta);
    focusLater(this.injector, this.elementRef.nativeElement, id, delta);
  }
}
