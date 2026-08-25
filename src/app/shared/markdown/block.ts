export type BlockKind =
  | 'heading'
  | 'paragraph'
  | 'table'
  | 'code'
  | 'mermaid'
  | 'blockquote'
  | 'list'
  | 'hr'
  | 'html'
  | 'other';

/** 改ページ調整パネルに表示する 1 ブロックの情報 */
export interface Block {
  readonly id: string;
  readonly kind: BlockKind;
  readonly label: string;
  readonly level: number | null;
  readonly fileIndex: number;
  readonly fileName: string;
  /** 2 番目以降のファイルの先頭ブロックか (常に強制改ページになる境界) */
  readonly isFileBoundary: boolean;
}

/** 1 ファイル分の変換済み HTML (mermaid の SVG 化・置換は呼び出し側で完了している前提) */
export interface FileFragment {
  readonly fileIndex: number;
  readonly fileName: string;
  readonly html: string;
}
