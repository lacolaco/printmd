import DOMPurify from 'dompurify';
import hljs from 'highlight.js/lib/common';
import MarkdownIt from 'markdown-it';
import taskLists from 'markdown-it-task-lists';

/** 遅延して SVG 化する mermaid コードブロック。placeholder の id で HTML 側と対応する */
export interface MermaidBlock {
  readonly id: string;
  readonly code: string;
}

export interface RenderMarkdownResult {
  readonly html: string;
  readonly mermaidBlocks: readonly MermaidBlock[];
}

const md = new MarkdownIt({
  // 生 HTML は GFM で表示される範囲で通す (許可外はサニタイザがタグだけ剥ぐ)
  html: true,
  linkify: true,
  // GitHub 同等のシンタックスハイライト。未知の言語は既定のエスケープに任せる
  highlight: (code, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
    }
    return '';
  },
}).use(taskLists);

/**
 * GitHub のサニタイザが許すタグの相当品 + 内部で使う mermaid プレースホルダ用の div。
 * DOMPurify の既定は marquee 等の遺物も許すため明示的に絞る
 */
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr', 'b', 'i', 'strong', 'em',
    'a', 'pre', 'code', 'img', 'tt', 'div', 'span', 'ins', 'del', 'sup', 'sub',
    'ol', 'ul', 'li', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'caption',
    'blockquote', 'dl', 'dt', 'dd', 'kbd', 'q', 'samp', 'var', 'ruby', 'rt', 'rp',
    's', 'strike', 'summary', 'details', 'figure', 'figcaption', 'abbr', 'bdo',
    'cite', 'dfn', 'mark', 'small', 'time', 'wbr', 'input',
  ],
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title', 'id', 'class', 'checked', 'disabled', 'type',
    'colspan', 'rowspan', 'align', 'width', 'height', 'open', 'start', 'dir',
    'lang', 'datetime', 'cite',
  ],
} satisfies import('dompurify').Config;

let mermaidSeq = 0;

interface RenderEnv {
  mermaidBlocks: MermaidBlock[];
}

const defaultFence = md.renderer.rules['fence']!.bind(md.renderer.rules);
md.renderer.rules['fence'] = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  if (token.info.trim() !== 'mermaid') {
    return defaultFence(tokens, idx, options, env, self);
  }
  const id = `printmd-mermaid-${mermaidSeq++}`;
  (env as unknown as RenderEnv).mermaidBlocks.push({ id, code: token.content.trim() });
  return `<div class="mermaid-placeholder" id="${id}"></div>`;
};

/**
 * Markdown を GitHub 相当の HTML に変換する。mermaid フェンスは SVG 化を
 * 別工程 (MermaidRenderer) に委ねるため、ここではプレースホルダ要素に
 * 差し替えて元コードを返すだけに留める。
 */
export function renderMarkdown(content: string): RenderMarkdownResult {
  const env: RenderEnv = { mermaidBlocks: [] };
  const rendered = md.render(content, env as unknown as Record<string, unknown>);
  // GitHub と同様に生 HTML はサニタイズして通す。script 等は中身ごと除去され、
  // 許可外のタグはタグだけ剥がれてテキストが残る
  const html = DOMPurify.sanitize(rendered, SANITIZE_CONFIG);
  return { html, mermaidBlocks: env.mermaidBlocks };
}
