import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Toolbar as AriaToolbar } from '@angular/aria/toolbar';
import { PAPERS } from '../../shared/paper/paper-catalog';
import type { PaperFormat } from '../../shared/paper/paper-format';
import { PaperControl } from './paper-control';

@Component({
  imports: [AriaToolbar, PaperControl],
  template: `
    <div ngToolbar aria-label="表示設定">
      <app-paper-control [(selected)]="selected" />
    </div>
  `,
})
class Host {
  readonly selected = signal<PaperFormat>(PAPERS.initial);
}

const FIRST = PAPERS.formats[0];
const LAST = PAPERS.formats[PAPERS.formats.length - 1];

async function render(current: PaperFormat) {
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.selected.set(current);
  fixture.detectChanges();
  await fixture.whenStable();
  const el = fixture.nativeElement as HTMLElement;
  const buttons = el.querySelectorAll<HTMLButtonElement>('button');
  return { fixture, el, back: buttons[0], forward: buttons[1] };
}

describe('PaperControl', () => {
  it('現在の書式の表示名を出す', async () => {
    const { el } = await render(LAST);
    expect(el.textContent).toContain(LAST.label);
  });

  it('読み上げの名前に現在の書式を含める', async () => {
    const { back, forward } = await render(FIRST);
    expect(back.getAttribute('aria-label')).toBe(`用紙 ${FIRST.label} を前へ`);
    expect(forward.getAttribute('aria-label')).toBe(`用紙 ${FIRST.label} を次へ`);
  });

  it('クリックで次の書式へ変える', async () => {
    const { fixture, forward } = await render(FIRST);
    forward.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selected()).toBe(PAPERS.next(FIRST, 1));
  });

  it('両端では該当ボタンを無効として伝える', async () => {
    const first = await render(FIRST);
    expect(first.back.getAttribute('aria-disabled')).toBe('true');
    const last = await render(LAST);
    expect(last.forward.getAttribute('aria-disabled')).toBe('true');
  });

  it('両端で押しても書式は変わらない', async () => {
    const { fixture, back } = await render(FIRST);
    back.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selected()).toBe(FIRST);
  });

  it('Enter で次の書式へ変え、既定動作を止める', async () => {
    const { fixture, forward } = await render(FIRST);
    const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    forward.dispatchEvent(event);
    fixture.detectChanges();
    expect(event.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.selected()).toBe(PAPERS.next(FIRST, 1));
  });

  it('Space でも次の書式へ変える', async () => {
    const { fixture, forward } = await render(FIRST);
    forward.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', cancelable: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.selected()).toBe(PAPERS.next(FIRST, 1));
  });

  it('他のキーはそのまま通す', async () => {
    const { fixture, forward } = await render(FIRST);
    const event = new KeyboardEvent('keydown', { key: 'a', cancelable: true });
    forward.dispatchEvent(event);
    fixture.detectChanges();
    expect(event.defaultPrevented).toBe(false);
    expect(fixture.componentInstance.selected()).toBe(FIRST);
  });

  it('長押しの繰り返しは 2 度目以降を無視する', async () => {
    const { fixture, forward } = await render(FIRST);
    forward.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    forward.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', repeat: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.selected()).toBe(PAPERS.next(FIRST, 1));
  });

  it('ネイティブの select を使わない', async () => {
    const { el } = await render(FIRST);
    expect(el.querySelector('select')).toBeNull();
  });
});
