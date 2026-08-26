import {
  DOCUMENT,
  InjectionToken,
  Service,
  computed,
  effect,
  inject,
  makeEnvironmentProviders,
  type EnvironmentProviders,
} from '@angular/core';
import type { CustomProperties } from './custom-properties';

const SETTINGS = new InjectionToken<readonly (() => CustomProperties)[]>(
  '紙面の組み上がりを決める設定',
);

/**
 * 紙面の組み上がりを決める設定を登録する。増やせるのはここへの登録だけで済み、
 * 束ねる側と読む側は変わらない
 */
export function provideLayoutSetting(create: () => () => CustomProperties): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: SETTINGS, multi: true, useFactory: create }]);
}

/**
 * 紙面の組み上がりを決める設定の集まり。登録された設定のカスタムプロパティを
 * 束ねて文書へ書く。画面と紙が同じ値を見ることがページ割り一致の前提になる
 */
@Service()
export class StyleVariables {
  private readonly registered = inject(SETTINGS, { optional: true }) ?? [];
  private readonly root = inject(DOCUMENT).documentElement;

  /** 全設定のカスタムプロパティ。組み上がりに影響する導出はこれを源とする */
  readonly all = computed<CustomProperties>(() => this.registered.flatMap((read) => read()));

  /** 直前に書いた名前。供給が消えたら消し戻すために覚える */
  private written: readonly string[] = [];

  constructor() {
    // ここは DOM 書き込みのみ
    effect(() => this.write(this.all()));
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
