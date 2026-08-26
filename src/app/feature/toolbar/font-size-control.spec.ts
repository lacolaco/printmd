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
    <div ngToolbar aria-label="文字サイズ">
      <app-font-size-control [(selected)]="selected" />
    </div>
  `,
})
class Host {
  readonly selected = signal<FontSize>(SIZES[4]);
}

async function render(size: FontSize) {
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.selected.set(size);
  fixture.detectChanges();
  await fixture.whenStable();
  const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll('button');
  return { fixture, shrink: buttons[0], grow: buttons[1] };
}

describe('FontSizeControl', () => {
  it('現在の段の表示名を表示する', async () => {
    const { fixture } = await render(SIZES[4]);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('12pt');
  });

  it('クリックで段を送る', async () => {
    const { fixture, grow } = await render(SIZES[4]);
    grow.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selected()).toBe(SIZES[5]);
  });

  it('両端では該当ボタンを disabled にする', async () => {
    const { shrink } = await render(SIZES[0]);
    expect(shrink.getAttribute('aria-disabled')).toBe('true');
    const { grow } = await render(SIZES[SIZES.length - 1]);
    expect(grow.getAttribute('aria-disabled')).toBe('true');
  });

  it('Enter キーで段を送り、既定動作は止める', async () => {
    const { fixture, grow } = await render(SIZES[4]);
    const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    grow.dispatchEvent(event);
    fixture.detectChanges();
    expect(event.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.selected()).toBe(SIZES[5]);
  });

  it('長押しの repeat では 2 度目以降を送らない', async () => {
    const { fixture, grow } = await render(SIZES[4]);
    grow.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    grow.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', repeat: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.selected()).toBe(SIZES[5]);
  });
});
