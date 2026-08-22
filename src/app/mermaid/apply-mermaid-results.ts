import DOMPurify from 'dompurify';
import type { MermaidOutcome } from './mermaid-renderer';

const MERMAID_FAILED_MESSAGE = 'mermaid の描画に失敗したため、元のコードを表示しています';

/**
 * renderMarkdown が残した mermaid-placeholder を、SVG 化の結果で置き換える。
 * 成功は <figure class="mermaid"> に SVG を埋め込み、失敗は元コードのコード
 * ブロック + 警告文に落とす。結果に含まれない (未解決の) プレースホルダは
 * そのまま残す。
 */
export function applyMermaidResults(
  html: string,
  results: ReadonlyMap<string, MermaidOutcome>,
): string {
  if (!html.includes('mermaid-placeholder')) return html;

  const temp = document.createElement('div');
  temp.innerHTML = html;
  temp.querySelectorAll('.mermaid-placeholder').forEach((placeholder) => {
    const outcome = results.get(placeholder.id);
    if (outcome === undefined) return;

    const figure = document.createElement('figure');
    if ('svg' in outcome) {
      figure.className = 'mermaid';
      // mermaid 自身のサニタイズ (securityLevel: strict) に単独で頼らず、
      // アプリの唯一の無害化境界である DOMPurify をここでも通す
      figure.innerHTML = DOMPurify.sanitize(outcome.svg, {
        USE_PROFILES: { svg: true, svgFilters: true },
      });
    } else {
      figure.className = 'mermaid mermaid-failed';
      const pre = document.createElement('pre');
      const code = document.createElement('code');
      code.textContent = outcome.code;
      pre.append(code);
      const warning = document.createElement('p');
      warning.className = 'mermaid-warning';
      warning.textContent = MERMAID_FAILED_MESSAGE;
      figure.append(pre, warning);
    }
    placeholder.replaceWith(figure);
  });
  return temp.innerHTML;
}
