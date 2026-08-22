import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { FileAddInput } from './file-add-input';

@Component({
  imports: [FileAddInput],
  template: `<app-file-add-input (selected)="selections.push($event)" />`,
})
class Host {
  readonly selections: (readonly File[])[] = [];
}

describe('FileAddInput', () => {
  it('ファイル選択 (input change) で選択ファイルを通知し、入力をリセットする', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      'input[type="file"]',
    )!;
    const file = new File(['# A'], 'a.md');
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    input.dispatchEvent(new Event('change'));
    expect(fixture.componentInstance.selections).toEqual([[file]]);
    expect(input.value).toBe('');
  });

  it('ドロップで選択ファイルを通知し、既定動作を抑止する', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const label = (fixture.nativeElement as HTMLElement).querySelector('label')!;
    const dragover = new Event('dragover', { cancelable: true });
    label.dispatchEvent(dragover);
    expect(dragover.defaultPrevented).toBe(true);

    const file = new File(['# A'], 'a.md');
    const drop = new Event('drop', { cancelable: true });
    Object.defineProperty(drop, 'dataTransfer', { value: { files: [file] } });
    label.dispatchEvent(drop);
    expect(drop.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.selections).toEqual([[file]]);
  });

  it('ファイルの無いドロップでは通知しない', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const label = (fixture.nativeElement as HTMLElement).querySelector('label')!;
    const drop = new Event('drop', { cancelable: true });
    Object.defineProperty(drop, 'dataTransfer', { value: { files: [] } });
    label.dispatchEvent(drop);
    expect(fixture.componentInstance.selections).toEqual([]);
  });
});
