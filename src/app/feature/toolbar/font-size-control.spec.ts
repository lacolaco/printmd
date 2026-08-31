import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Toolbar as AriaToolbar } from '@angular/aria/toolbar';
import { FONT_SIZE, Typography } from '../../shared/typography/typography';
import { FontSizeControl } from './font-size-control';

@Component({
  imports: [AriaToolbar, FontSizeControl],
  template: ` <div ngToolbar aria-label="表示設定"><app-font-size-control /></div> `,
})
class Host {}

async function render(current: number) {
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
    const { el } = await render(10.5);
    expect(el.textContent).toContain('10.5pt');
  });

  it('読み上げの名前に現在の文字サイズを含める', async () => {
    const { down, up } = await render(11);
    expect(down.getAttribute('aria-label')).toContain('11pt');
    expect(up.getAttribute('aria-label')).toContain('11pt');
  });

  it('押すと Typography の文字サイズが刻みぶん動く', async () => {
    const { fixture, up } = await render(12);
    up.click();
    fixture.detectChanges();
    expect(TestBed.inject(Typography).size()).toBe(12 + FONT_SIZE.step);
  });

  it('下限では小さくできない', async () => {
    const { down, up } = await render(FONT_SIZE.min);
    expect(down.getAttribute('aria-disabled')).toBe('true');
    expect(up.getAttribute('aria-disabled')).toBe('false');
  });

  it('上限では大きくできない', async () => {
    const { down, up } = await render(FONT_SIZE.max);
    expect(down.getAttribute('aria-disabled')).toBe('false');
    expect(up.getAttribute('aria-disabled')).toBe('true');
  });
});
