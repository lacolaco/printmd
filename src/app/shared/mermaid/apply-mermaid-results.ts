import DOMPurify from 'dompurify';
import { ifDefined } from '../optional';
import type { MermaidOutcome } from './mermaid-renderer';

const FAILURE_TEXT = 'mermaid の描画に失敗したため、元のコードを表示しています';

/**
 * renderMarkdown が残した mermaid-placeholder を、SVG 化の結果で置き換える。
 * 成功は <figure class="mermaid"> に SVG を埋め込み、失敗は元コードのコード
 * ブロック + 警告文に落とす。結果に含まれない (未解決の) プレースホルダは
 * そのまま残す。
 */
function isUnresolved(html: string): boolean {
  return html.includes('mermaid-placeholder');
}

export function applyMermaidResults(
  html: string,
  results: ReadonlyMap<string, MermaidOutcome>,
): string {
  return isUnresolved(html) ? replacePlaceholders(html, results) : html;
}

function replacePlaceholders(html: string, results: ReadonlyMap<string, MermaidOutcome>): string {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  temp.querySelectorAll('.mermaid-placeholder').forEach((el) => settleOne(el, results));
  return temp.innerHTML;
}

function settleOne(placeholder: Element, results: ReadonlyMap<string, MermaidOutcome>): void {
  ifDefined(results.get(placeholder.id), (outcome) => placeholder.replaceWith(figureFor(outcome)));
}

function figureFor(outcome: MermaidOutcome): HTMLElement {
  return 'svg' in outcome ? embedSvg(outcome.svg) : degraded(outcome.code);
}

function embedSvg(svg: string): HTMLElement {
  const figure = document.createElement('figure');
  figure.className = 'mermaid';
  // mermaid 自身のサニタイズに単独で頼らず、DOMPurify を通す (アプリ唯一の無害化境界)
  figure.innerHTML = DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } });
  return figure;
}

function degraded(code: string): HTMLElement {
  const figure = document.createElement('figure');
  figure.className = 'mermaid mermaid-failed';
  figure.append(sourcePre(code), warningNote());
  return figure;
}

function codeNode(code: string): HTMLElement {
  const el = document.createElement('code');
  el.textContent = code;
  return el;
}

function sourcePre(code: string): HTMLElement {
  const pre = document.createElement('pre');
  pre.append(codeNode(code));
  return pre;
}

function warningNote(): HTMLElement {
  const warning = document.createElement('p');
  warning.className = 'mermaid-warning';
  warning.textContent = FAILURE_TEXT;
  return warning;
}
