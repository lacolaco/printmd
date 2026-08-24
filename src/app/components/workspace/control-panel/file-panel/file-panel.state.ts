import { Injectable, signal } from '@angular/core';

/** FilePanel のローカルステート。並べ替え結果の読み上げ文 (role=status が購読) */
@Injectable()
export class FilePanelState {
  readonly message = signal('');

  moved(name: string, index: number): void {
    this.message.set(`${name}を${index + 1}番目に移動しました。改ページ指定はリセットされます`);
  }
}
