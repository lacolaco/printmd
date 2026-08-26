import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Toolbar as AriaToolbar } from '@angular/aria/toolbar';
import { SIZES } from '../../shared/typography/font-catalog';
import type { FontSize } from '../../shared/typography/font-size';
import { FontSizeControl } from './font-size-control';

@Component({
  imports: [AriaToolbar, FontSizeControl],
  template: `
    <div ngToolbar aria-label="表示設定">
      <app-font-size-control [(selected)]="selected" />
    </div>
  `,
})
class Host {
  readonly selected = signal<FontSize>(SIZES.initial);
}

const SMALLEST = SIZES.sizes[0];
const LARGEST = SIZES.sizes[SIZES.sizes.length - 1];

async function render(current: FontSize) {
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.selected.set(current);
  fixture.detectChanges();
  await fixture.whenStable();
  const el = fixture.nativeElement as HTMLElement;
  const buttons = el.querySelectorAll<HTMLButtonElement>('button');
  return { fixture, el, down: buttons[0], up: buttons[1] };
}

describe('FontSizeControl', () => {
  it('現在の文字サイズの表示名を出す', async () => {
    const { el } = await render(SIZES.initial);
    expect(el.textContent).toContain(SIZES.initial.label);
  });

  it('読み上げの名前に現在の文字サイズを含める', async () => {
    const { down, up } = await render(SIZES.initial);
    expect(down.getAttribute('aria-label')).toBe(`文字 ${SIZES.initial.label} を小さく`);
    expect(up.getAttribute('aria-label')).toBe(`文字 ${SIZES.initial.label} を大きく`);
  });

  it('クリックで次の文字サイズへ変える', async () => {
    const { fixture, up } = await render(SIZES.initial);
    up.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selected()).toBe(SIZES.next(SIZES.initial, 1));
  });

  it('両端では該当ボタンを無効として伝える', async () => {
    const smallest = await render(SMALLEST);
    expect(smallest.down.getAttribute('aria-disabled')).toBe('true');
    const largest = await render(LARGEST);
    expect(largest.up.getAttribute('aria-disabled')).toBe('true');
  });

  it('両端で押しても文字サイズは変わらない', async () => {
    const { fixture, down } = await render(SMALLEST);
    down.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selected()).toBe(SMALLEST);
  });

  it('Enter で次の文字サイズへ変え、既定動作を止める', async () => {
    const { fixture, up } = await render(SIZES.initial);
    const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    up.dispatchEvent(event);
    fixture.detectChanges();
    expect(event.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.selected()).toBe(SIZES.next(SIZES.initial, 1));
  });

  it('長押しの繰り返しは 2 度目以降を無視する', async () => {
    const { fixture, up } = await render(SIZES.initial);
    up.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    up.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', repeat: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.selected()).toBe(SIZES.next(SIZES.initial, 1));
  });
});
