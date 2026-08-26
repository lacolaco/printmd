import { DOCUMENT, Service, computed, effect, inject, signal } from '@angular/core';
import type { CustomProperties, LayoutSetting } from './layout-setting';

/**
 * ページ割りに関わる設定の集まり。登録された設定のカスタムプロパティを
 * まとめて文書へ書く。画面と紙が同じ値を見ることがページ割り一致の前提になる
 */
@Service()
export class StyleVariables {
  private readonly root = inject(DOCUMENT).documentElement;
  private readonly settings = signal<readonly LayoutSetting[]>([]);

  /** 全設定のカスタムプロパティ。ページ割りに関わる導出はこれを読む */
  readonly all = computed<CustomProperties>(() => this.settings().flatMap((read) => read()));

  /** 直前に書いた名前。設定が返さなくなったとき消すために覚える */
  private written: readonly string[] = [];

  constructor() {
    // ここは DOM 書き込みのみ
    effect(() => this.write(this.all()));
  }

  /** 設定を登録する。設定が増えても、まとめる側と読む側は変わらない */
  register(setting: LayoutSetting): void {
    this.settings.update((current) => [...current, setting]);
  }

  private write(properties: CustomProperties): void {
    const names = properties.map(([name]) => name);
    this.written.filter((name) => !names.includes(name)).forEach((name) => this.clear(name));
    properties.forEach(([name, value]) => this.root.style.setProperty(name, value));
    this.written = names;
  }

  private clear(name: string): void {
    this.root.style.removeProperty(name);
  }
}
