import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Manuscripts } from '../../shared/manuscript/manuscripts';
import { Header } from './header';

describe('Header', () => {
  it('原稿がないときは印刷ボタンを出さない (刷るものがない)', async () => {
    const fixture = TestBed.createComponent(Header);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('printmd');
    expect(el.querySelector('.app-print-button')).toBeNull();
  });

  it('原稿があれば印刷ボタンを出す', async () => {
    const manuscripts = TestBed.inject(Manuscripts);
    await manuscripts.add([{ name: 'a.md', text: () => Promise.resolve('# A\n\n本文') }]);

    const fixture = TestBed.createComponent(Header);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.app-print-button')).not.toBeNull();
  });
});
