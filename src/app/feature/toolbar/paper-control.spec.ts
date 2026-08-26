import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Toolbar as AriaToolbar } from '@angular/aria/toolbar';
import { DEFAULT_PAPER, PAPERS } from '../../shared/paper/paper-catalog';
import type { PaperFormat } from '../../shared/paper/paper-format';
import { PaperControl } from './paper-control';

@Component({
  imports: [AriaToolbar, PaperControl],
  template: `
    <div ngToolbar aria-label="用紙">
      <app-paper-control [(selected)]="selected" />
    </div>
  `,
})
class Host {
  readonly selected = signal<PaperFormat>(DEFAULT_PAPER);
}

async function render(paper: PaperFormat) {
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.selected.set(paper);
  fixture.detectChanges();
  await fixture.whenStable();
  const el = fixture.nativeElement as HTMLElement;
  const buttons = el.querySelectorAll<HTMLButtonElement>('button');
  return { fixture, el, previous: buttons[0], next: buttons[1] };
}

const FIRST = PAPERS.items[0];
const LAST = PAPERS.items[PAPERS.items.length - 1];

describe('PaperControl', () => {
  it('現在の書式の表示名を出す', async () => {
    const { el } = await render(LAST);
    expect(el.textContent).toContain(LAST.label);
  });

  it('段を送るとその書式を返す', async () => {
    const { fixture, next } = await render(FIRST);
    next.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selected()).toBe(PAPERS.next(FIRST, 1));
  });

  it('一覧の両端では送れない', async () => {
    const first = await render(FIRST);
    expect(first.previous.getAttribute('aria-disabled')).toBe('true');
    const last = await render(LAST);
    expect(last.next.getAttribute('aria-disabled')).toBe('true');
  });

  it('帯の中でも select を使わない (Toolbar が pointerdown を止めるため)', async () => {
    const { el } = await render(DEFAULT_PAPER);
    expect(el.querySelector('select')).toBeNull();
  });

  it('Enter キーで段を送り、既定動作は止める', async () => {
    const { fixture, next } = await render(FIRST);
    const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    next.dispatchEvent(event);
    fixture.detectChanges();
    expect(event.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.selected()).toBe(PAPERS.next(FIRST, 1));
  });

  it('長押しの repeat では 2 度目以降を送らない', async () => {
    const { fixture, next } = await render(FIRST);
    next.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    next.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', repeat: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.selected()).toBe(PAPERS.next(FIRST, 1));
  });
});
