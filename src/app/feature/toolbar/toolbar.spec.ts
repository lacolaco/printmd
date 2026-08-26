import { TestBed } from '@angular/core/testing';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { MermaidRenderer, type MermaidLike } from '../../shared/mermaid/mermaid-renderer';
import { Manuscripts } from '../../shared/manuscript/manuscripts';
import { PAPERS } from '../../shared/paper/paper-catalog';
import { Paper } from '../../shared/paper/paper';
import { Zoom } from '../../shared/pagination/zoom';
import { Toolbar } from './toolbar';

class FakeMermaidRenderer extends MermaidRenderer {
  protected override loadModule(): Promise<MermaidLike> {
    return Promise.resolve({
      initialize: () => {},
      render: (_id, code) => Promise.resolve({ svg: `<svg data-code="${code}"></svg>` }),
    });
  }
}

function paperButtons(el: HTMLElement): HTMLButtonElement[] {
  return [...el.querySelectorAll<HTMLButtonElement>('[ngToolbarWidgetGroup] button')];
}

describe('Toolbar', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: MermaidRenderer, useClass: FakeMermaidRenderer }],
    });
    const manuscripts = TestBed.inject(Manuscripts);
    await manuscripts.add([{ name: 'a.md', text: () => Promise.resolve('# A\n\n本文') }]);
  });

  it('頁数とズームを表示し、ズーム操作が Zoom に反映される', async () => {
    const fixture = TestBed.createComponent(Toolbar);
    fixture.detectChanges();
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[role="status"]')?.textContent).toContain('ページ');
    el.querySelector<HTMLButtonElement>('[aria-label="縮小"]')!.click();
    fixture.detectChanges();
    expect(TestBed.inject(Zoom).label()).toBe('75%');
    expect(el.textContent).toContain('75%');
  });

  it('用紙のボタンをクリックすると Paper に反映される', async () => {
    const fixture = TestBed.createComponent(Toolbar);
    fixture.detectChanges();
    await fixture.whenStable();

    const other = PAPERS[PAPERS.length - 1];
    const el = fixture.nativeElement as HTMLElement;
    const buttons = paperButtons(el);
    expect(buttons.map((button) => button.textContent?.trim())).toEqual(
      PAPERS.map((paper) => paper.label),
    );
    buttons[buttons.length - 1].click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(TestBed.inject(Paper).format()).toBe(other);
  });

  it('帯全体が role="toolbar" として表示設定の名前で公開される', async () => {
    const fixture = TestBed.createComponent(Toolbar);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[role="toolbar"][aria-label="表示設定"]')).not.toBeNull();
  });

  it('矢印キーで widget 間をロービング focus できる', async () => {
    const fixture = TestBed.createComponent(Toolbar);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const user = userEvent.setup();

    const widgets = [...el.querySelectorAll<HTMLElement>('[ngToolbarWidget]')];
    widgets[0].focus();
    expect(document.activeElement).toBe(widgets[0]);

    await user.keyboard('{ArrowRight}');
    fixture.detectChanges();
    expect(document.activeElement).toBe(widgets[1]);

    await user.keyboard('{ArrowLeft}');
    fixture.detectChanges();
    expect(document.activeElement).toBe(widgets[0]);
  });

  it('用紙ボタンにフォーカスした状態で Enter を押すと Paper に反映される', async () => {
    const fixture = TestBed.createComponent(Toolbar);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const user = userEvent.setup();

    const other = PAPERS[PAPERS.length - 1];
    const buttons = paperButtons(el);
    buttons[buttons.length - 1].focus();

    await user.keyboard('{Enter}');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(TestBed.inject(Paper).format()).toBe(other);
  });

  it('縮小ボタンにフォーカスした状態で Space を押すと Zoom に反映される', async () => {
    const fixture = TestBed.createComponent(Toolbar);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const user = userEvent.setup();

    el.querySelector<HTMLButtonElement>('[aria-label="縮小"]')!.focus();
    await user.keyboard(' ');
    fixture.detectChanges();

    expect(TestBed.inject(Zoom).label()).toBe('75%');
  });

  it('Enter を長押し (repeat) しても縮小は 1 刻みしか進まない', async () => {
    const fixture = TestBed.createComponent(Toolbar);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    const shrink = el.querySelector<HTMLButtonElement>('[aria-label="縮小"]')!;
    shrink.focus();
    const first = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    const repeat1 = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
      repeat: true,
    });
    const repeat2 = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
      repeat: true,
    });
    shrink.dispatchEvent(first);
    shrink.dispatchEvent(repeat1);
    shrink.dispatchEvent(repeat2);
    fixture.detectChanges();

    // repeat の keydown も、native の click 合成を断つため必ず preventDefault される
    expect([first, repeat1, repeat2].every((event) => event.defaultPrevented)).toBe(true);
    expect(TestBed.inject(Zoom).label()).toBe('75%');
  });

  it('Space を長押し (repeat) しても用紙の選択は 1 回しか反映されない', async () => {
    const fixture = TestBed.createComponent(Toolbar);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    const other = paperButtons(el)[PAPERS.length - 1];
    other.focus();
    const first = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    const repeat = new KeyboardEvent('keydown', {
      key: ' ',
      bubbles: true,
      cancelable: true,
      repeat: true,
    });
    other.dispatchEvent(first);
    other.dispatchEvent(repeat);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(first.defaultPrevented).toBe(true);
    expect(repeat.defaultPrevented).toBe(true);
    expect(TestBed.inject(Paper).format()).toBe(PAPERS[PAPERS.length - 1]);
    expect(other.getAttribute('aria-pressed')).toBe('true');
  });
});
