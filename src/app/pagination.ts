/** 強制改ページで区切られた、連続するトップレベルブロックの範囲 [start, end) */
export interface SegmentRange {
  readonly start: number;
  readonly end: number;
}

export interface PageSegment extends SegmentRange {
  /** このセグメント単独のページ数 */
  readonly pages: number;
  /** 文書全体での開始ページ (0 始まり) */
  readonly firstPage: number;
}

export interface Pagination {
  readonly total: number;
  readonly segments: readonly PageSegment[];
}
