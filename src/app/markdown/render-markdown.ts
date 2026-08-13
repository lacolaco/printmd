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

const md = new MarkdownIt({ html: false, linkify: true }).use(taskLists);

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
  const html = md.render(content, env as unknown as Record<string, unknown>);
  return { html, mermaidBlocks: env.mermaidBlocks };
}
