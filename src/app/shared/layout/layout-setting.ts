/** 画面 CSS が読むカスタムプロパティ (名前と値の組の列) */
export type CustomProperties = readonly (readonly [string, string])[];

/**
 * ページ割りに関わる設定。現在の値をカスタムプロパティとして返す。
 * 用紙書式や文字サイズのように紙面の見え方を決める値が、この形で
 * StyleVariables へ自分を登録する
 */
export type LayoutSetting = () => CustomProperties;
