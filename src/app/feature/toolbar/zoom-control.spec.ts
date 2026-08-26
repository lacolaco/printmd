import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Toolbar as AriaToolbar } from '@angular/aria/toolbar';
import { ZOOMS } from '../../shared/pagination/zoom';
import { ZoomControl } from './zoom-control';

@Component({
  imports: [AriaToolbar, ZoomControl],
  template: `
    <div ngToolbar aria-label="表示倍率">
      <app-zoom-control [(selected)]="selected" />
    </div>
  `,
})
class Host {
  readonly selected = signal(ZOOMS.indexOf(1));
}

async function render(index: number) {
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.selected.set(index);
  fixture.detectChanges();
  await fixture.whenStable();
  const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll('button');
  return { fixture, shrink: buttons[0], grow: buttons[1] };
}

describe('ZoomControl', () => {
  it('現在の段の百分率を表示する', async () => {
    const { fixture } = await render(ZOOMS.indexOf(1.5));
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('150%');
  });

  it('クリックで段を送る', async () => {
    const { fixture, grow } = await render(ZOOMS.indexOf(1));
    grow.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selected()).toBe(ZOOMS.indexOf(1.25));
  });

  it('両端では該当ボタンを disabled にする', async () => {
    const { shrink } = await render(0);
    expect(shrink.getAttribute('aria-disabled')).toBe('true');
    const { grow } = await render(ZOOMS.length - 1);
    expect(grow.getAttribute('aria-disabled')).toBe('true');
  });

  it('Enter キーで段を送り、既定動作は止める', async () => {
    const { fixture, grow } = await render(ZOOMS.indexOf(1));
    const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    grow.dispatchEvent(event);
    fixture.detectChanges();
    expect(event.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.selected()).toBe(ZOOMS.indexOf(1.25));
  });

  it('長押しの repeat では 2 度目以降を送らない', async () => {
    const { fixture, grow } = await render(ZOOMS.indexOf(1));
    grow.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    grow.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', repeat: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.selected()).toBe(ZOOMS.indexOf(1.25));
  });
});
