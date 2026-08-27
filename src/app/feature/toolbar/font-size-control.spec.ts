import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Toolbar as AriaToolbar } from '@angular/aria/toolbar';
import { SIZES } from '../../shared/typography/font-catalog';
import { Typography } from '../../shared/typography/typography';
import type { FontSize } from '../../shared/typography/font-size';
import { FontSizeControl } from './font-size-control';

@Component({
  imports: [AriaToolbar, FontSizeControl],
  template: ` <div ngToolbar aria-label="表示設定"><app-font-size-control /></div> `,
})
class Host {}

const SMALLEST = SIZES.sizes[0];
const LARGEST = SIZES.sizes[SIZES.sizes.length - 1];

async function render(current: FontSize) {
  TestBed.inject(Typography).size.set(current);
  const fixture = TestBed.createComponent(Host);
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
    expect(down.getAttribute('aria-label')).toContain(SIZES.initial.label);
    expect(up.getAttribute('aria-label')).toContain(SIZES.initial.label);
  });

  it('押すと Typography の文字サイズが隣へ動く', async () => {
    const { fixture, up } = await render(SIZES.initial);
    up.click();
    fixture.detectChanges();
    expect(TestBed.inject(Typography).size()).toBe(SIZES.next(SIZES.initial, 1));
  });

  it('一覧の下端では小さくできない', async () => {
    const { down, up } = await render(SMALLEST);
    expect(down.getAttribute('aria-disabled')).toBe('true');
    expect(up.getAttribute('aria-disabled')).toBe('false');
  });

  it('一覧の上端では大きくできない', async () => {
    const { down, up } = await render(LARGEST);
    expect(down.getAttribute('aria-disabled')).toBe('false');
    expect(up.getAttribute('aria-disabled')).toBe('true');
  });
});
