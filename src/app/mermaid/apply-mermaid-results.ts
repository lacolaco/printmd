import DOMPurify from 'dompurify';
import type { MermaidOutcome } from './mermaid-renderer';

const MERMAID_FAILED_MESSAGE = 'mermaid の描画に失敗したため、元のコードを表示しています';

/**
 * renderMarkdown が残した mermaid-placeholder を、SVG 化の結果で置き換える。
 * 成功は <figure class="mermaid"> に SVG を埋め込み、失敗は元コードのコード
 * ブロック + 警告文に落とす。結果に含まれない (未解決の) プレースホルダは
 * そのまま残す。
 */
function containsPlaceholder(html: string): boolean {
  return html.includes('mermaid-placeholder');
}

export function applyMermaidResults(
  html: string,
  results: ReadonlyMap<string, MermaidOutcome>,
): string {
  return containsPlaceholder(html) ? replacePlaceholders(html, results) : html;
}

function replacePlaceholders(html: string, results: ReadonlyMap<string, MermaidOutcome>): string {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  temp.querySelectorAll('.mermaid-placeholder').forEach((el) => replacePlaceholder(el, results));
  return temp.innerHTML;
}

function ifDefined<T>(value: T | undefined, use: (value: T) => void): void {
  if (value !== undefined) use(value);
}

function replacePlaceholder(
  placeholder: Element,
  results: ReadonlyMap<string, MermaidOutcome>,
): void {
  ifDefined(results.get(placeholder.id), (outcome) => placeholder.replaceWith(buildMermaidFigure(outcome)));
}

function buildMermaidFigure(outcome: MermaidOutcome): HTMLElement {
  return 'svg' in outcome ? buildSuccessFigure(outcome.svg) : buildFailedFigure(outcome.code);
}

function buildSuccessFigure(svg: string): HTMLElement {
  const figure = document.createElement('figure');
  figure.className = 'mermaid';
  // mermaid 自身のサニタイズに単独で頼らず、DOMPurify を通す (アプリ唯一の無害化境界)
  figure.innerHTML = DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } });
  return figure;
}

function buildFailedFigure(code: string): HTMLElement {
  const figure = document.createElement('figure');
  figure.className = 'mermaid mermaid-failed';
  figure.append(buildFailedCodeBlock(code), buildFailedWarning());
  return figure;
}

function createCodeElement(code: string): HTMLElement {
  const el = document.createElement('code');
  el.textContent = code;
  return el;
}

function buildFailedCodeBlock(code: string): HTMLElement {
  const pre = document.createElement('pre');
  pre.append(createCodeElement(code));
  return pre;
}

function buildFailedWarning(): HTMLElement {
  const warning = document.createElement('p');
  warning.className = 'mermaid-warning';
  warning.textContent = MERMAID_FAILED_MESSAGE;
  return warning;
}
