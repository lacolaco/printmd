import { signal } from '@angular/core';

/** 並べ替え結果の読み上げ文。role=status のライブリージョンが購読する */
export class Announcer {
  readonly message = signal('');

  moved(name: string, index: number): void {
    this.message.set(`${name}を${index + 1}番目に移動しました。改ページ指定はリセットされます`);
  }
}
