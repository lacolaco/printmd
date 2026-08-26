import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Toolbar as AriaToolbar } from '@angular/aria/toolbar';
import { Steps } from '../../shared/support/steps';
import { StepControl } from './step-control';

const STEPS = new Steps(['小', '中', '大'], (item) => `${item}サイズ`);
const FIRST = STEPS.items[0];
const MIDDLE = STEPS.items[1];
const LAST = STEPS.items[STEPS.items.length - 1];

@Component({
  imports: [AriaToolbar, StepControl],
  template: `
    <div ngToolbar aria-label="表示設定">
      <app-step-control name="大きさ" [steps]="steps" [(selected)]="selected" />
    </div>
  `,
})
class Host {
  readonly steps = STEPS;
  readonly selected = signal(MIDDLE);
}

async function render(current: string) {
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.selected.set(current);
  fixture.detectChanges();
  await fixture.whenStable();
  const el = fixture.nativeElement as HTMLElement;
  const buttons = el.querySelectorAll<HTMLButtonElement>('button');
  return { fixture, el, back: buttons[0], forward: buttons[1] };
}

describe('StepControl', () => {
  it('操作の名前と現在の段の名前を出す', async () => {
    const { el } = await render(MIDDLE);
    expect(el.textContent).toContain('大きさ');
    expect(el.textContent).toContain(STEPS.nameOf(MIDDLE));
  });

  it('読み上げの名前は操作ごとに分かれる', async () => {
    const { back, forward } = await render(MIDDLE);
    expect(back.getAttribute('aria-label')).toBe('大きさを前へ');
    expect(forward.getAttribute('aria-label')).toBe('大きさを次へ');
  });

  it('クリックで段を送る', async () => {
    const { fixture, forward } = await render(MIDDLE);
    forward.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selected()).toBe(STEPS.next(MIDDLE, 1));
  });

  it('両端では該当ボタンを無効として伝える', async () => {
    const first = await render(FIRST);
    expect(first.back.getAttribute('aria-disabled')).toBe('true');
    const last = await render(LAST);
    expect(last.forward.getAttribute('aria-disabled')).toBe('true');
  });

  it('両端で押しても段は動かない', async () => {
    const { fixture, back } = await render(FIRST);
    back.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selected()).toBe(FIRST);
  });

  it('Enter キーで段を送り、既定動作は止める', async () => {
    const { fixture, forward } = await render(MIDDLE);
    const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    forward.dispatchEvent(event);
    fixture.detectChanges();
    expect(event.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.selected()).toBe(STEPS.next(MIDDLE, 1));
  });

  it('Space キーでも段を送る', async () => {
    const { fixture, forward } = await render(MIDDLE);
    forward.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', cancelable: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.selected()).toBe(STEPS.next(MIDDLE, 1));
  });

  it('段送りに関わらないキーは素通しする', async () => {
    const { fixture, forward } = await render(MIDDLE);
    const event = new KeyboardEvent('keydown', { key: 'a', cancelable: true });
    forward.dispatchEvent(event);
    fixture.detectChanges();
    expect(event.defaultPrevented).toBe(false);
    expect(fixture.componentInstance.selected()).toBe(MIDDLE);
  });

  it('長押しの repeat では 2 度目以降を送らない', async () => {
    const { fixture, forward } = await render(MIDDLE);
    forward.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    forward.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', repeat: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.selected()).toBe(STEPS.next(MIDDLE, 1));
  });

  it('帯の中では select を使わない (Toolbar が pointerdown を止めるため)', async () => {
    const { el } = await render(MIDDLE);
    expect(el.querySelector('select')).toBeNull();
  });
});
