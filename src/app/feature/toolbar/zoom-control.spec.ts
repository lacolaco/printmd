import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Toolbar as AriaToolbar } from '@angular/aria/toolbar';
import { ZoomControl } from './zoom-control';

@Component({
  imports: [AriaToolbar, ZoomControl],
  template: `
    <div ngToolbar aria-label="表示設定">
      <app-zoom-control
        [label]="label()"
        [isShrinkable]="isShrinkable()"
        [isGrowable]="isGrowable()"
        (shrink)="log.push('shrink')"
        (grow)="log.push('grow')"
      />
    </div>
  `,
})
class Host {
  readonly label = signal('100%');
  readonly isShrinkable = signal(true);
  readonly isGrowable = signal(true);
  readonly log: string[] = [];
}

async function render(shrinkable = true, growable = true) {
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.isShrinkable.set(shrinkable);
  fixture.componentInstance.isGrowable.set(growable);
  fixture.detectChanges();
  await fixture.whenStable();
  const el = fixture.nativeElement as HTMLElement;
  const buttons = el.querySelectorAll<HTMLButtonElement>('button');
  return { fixture, el, down: buttons[0], up: buttons[1], log: fixture.componentInstance.log };
}

describe('ZoomControl', () => {
  it('現在の倍率を出す', async () => {
    const { el } = await render();
    expect(el.textContent).toContain('100%');
  });

  it('読み上げの名前に現在の倍率を含める', async () => {
    const { down, up } = await render();
    expect(down.getAttribute('aria-label')).toBe('倍率 100% を下げる');
    expect(up.getAttribute('aria-label')).toBe('倍率 100% を上げる');
  });

  it('クリックでイベントを返す', async () => {
    const { down, up, log } = await render();
    down.click();
    up.click();
    expect(log).toEqual(['shrink', 'grow']);
  });

  it('送れない向きのボタンを無効として伝える', async () => {
    const { down, up } = await render(false, false);
    expect(down.getAttribute('aria-disabled')).toBe('true');
    expect(up.getAttribute('aria-disabled')).toBe('true');
  });

  it('Enter でイベントを返し、既定動作を止める', async () => {
    const { up, log } = await render();
    const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    up.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(log).toEqual(['grow']);
  });

  it('他のキーはそのまま通す', async () => {
    const { up, log } = await render();
    const event = new KeyboardEvent('keydown', { key: 'a', cancelable: true });
    up.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(log).toEqual([]);
  });

  it('長押しの繰り返しは 2 度目以降を無視する', async () => {
    const { up, log } = await render();
    up.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    up.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', repeat: true }));
    expect(log).toEqual(['grow']);
  });
});
