import { Service, inject } from '@angular/core';
import { isNonEmpty } from '../collections';
import { FileOrder } from '../manuscript/file-order';
import { Importer } from '../manuscript/importer';
import { isAtLimit, stepped } from '../pagination/zoom';
import type { ImportSource, ManuscriptFile } from '../manuscript/manuscript';
import { BreakState } from '../state/break-state';
import { ManuscriptState } from '../state/manuscript-state';
import { ZoomState } from '../state/zoom-state';

function isMarked(breaks: ReadonlySet<string>, blockId: string): boolean {
  return breaks.has(blockId);
}

function without(current: ReadonlySet<string>, blockId: string): ReadonlySet<string> {
  const next = new Set(current);
  next.delete(blockId);
  return next;
}

function withAdded(current: ReadonlySet<string>, blockId: string): ReadonlySet<string> {
  const next = new Set(current);
  next.add(blockId);
  return next;
}

function toggled(current: ReadonlySet<string>, blockId: string): ReadonlySet<string> {
  return isMarked(current, blockId) ? without(current, blockId) : withAdded(current, blockId);
}

function removedFrom(current: readonly ManuscriptFile[], id: number): readonly ManuscriptFile[] {
  const remaining = current.filter((f) => f.id !== id);
  return remaining.length === current.length ? current : remaining;
}

/** 編集操作。取り込み・並べ替え・削除・改ページ指定の判断を担い、状態へは結果だけを命じる */
@Service()
export class Editor {
  private readonly importer = inject(Importer);
  private readonly manuscripts = inject(ManuscriptState);
  private readonly marks = inject(BreakState);
  private readonly zoom = inject(ZoomState);

  async addFiles(sources: readonly ImportSource[]): Promise<void> {
    if (isNonEmpty(sources)) {
      const { files, warnings } = await this.importer.read(sources);
      this.manuscripts.warn(warnings);
      this.append(files);
    }
  }

  private append(files: readonly ManuscriptFile[]): void {
    if (isNonEmpty(files)) {
      this.manuscripts.replace([...this.manuscripts.files(), ...files]);
    }
  }

  removeFile(id: number): void {
    const current = this.manuscripts.files();
    this.replaceIfChanged(current, removedFrom(current, id));
  }

  isMovable(id: number, delta: -1 | 1): boolean {
    return new FileOrder(this.manuscripts.files()).isNudgeable(id, delta);
  }

  isReorderable(from: number, to: number): boolean {
    return new FileOrder(this.manuscripts.files()).isMovable(from, to);
  }

  /** ファイルを 1 つ上/下へ動かす。動けるかは isMovable で先に問い合わせる */
  nudge(id: number, delta: -1 | 1): void {
    const index = this.manuscripts.files().findIndex((f) => f.id === id);
    this.reorder(index, index + delta);
  }

  reorder(from: number, to: number): void {
    const current = this.manuscripts.files();
    this.replaceIfChanged(current, new FileOrder(current).reordered(from, to));
  }

  private replaceIfChanged(
    current: readonly ManuscriptFile[],
    next: readonly ManuscriptFile[],
  ): void {
    if (next !== current) {
      this.manuscripts.replace(next);
    }
  }

  toggleBreak(blockId: string): void {
    this.marks.replace(toggled(this.marks.breaks(), blockId));
  }

  zoomBy(delta: -1 | 1): void {
    this.zoom.replace(stepped(this.zoom.index(), delta));
  }

  /** delta 方向へまだズームできるか */
  isZoomable(delta: -1 | 1): boolean {
    return !isAtLimit(this.zoom.index(), delta);
  }
}
