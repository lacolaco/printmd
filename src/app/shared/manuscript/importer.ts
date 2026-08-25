import { Service } from '@angular/core';
import type { ImportSource, ManuscriptFile } from './manuscript';

const MARKDOWN_NAME_PATTERN = /\.(md|markdown|txt)$/i;

const UNSUPPORTED_WARNING = 'Markdown (.md / .markdown / .txt) 以外のファイルは取り込めません';

function importWarnings(nonMarkdownCount: number, failedNames: readonly string[]): string[] {
  const notice = nonMarkdownCount > 0 ? UNSUPPORTED_WARNING : null;
  const failed =
    failedNames.length > 0 ? `読み込めなかったファイル: ${failedNames.join(', ')}` : null;
  return [notice, failed].filter((warning): warning is string => warning !== null);
}

/** 取り込み入力の読み出し。Markdown だけを通し、読めなかったものは警告文にする */
@Service()
export class Importer {
  private serial = 1;

  /** 取り込み入力を読み出す。Markdown だけを通し、読めなかったものは警告文にする */
  async read(
    sources: readonly ImportSource[],
  ): Promise<{ files: ManuscriptFile[]; warnings: string[] }> {
    const { loaded, failedNames } = await this.gather(sources);
    const markdownOnly = loaded.filter((f) => MARKDOWN_NAME_PATTERN.test(f.name));
    const { length: accepted } = markdownOnly;
    return { files: markdownOnly, warnings: importWarnings(loaded.length - accepted, failedNames) };
  }

  private async gather(
    sources: readonly ImportSource[],
  ): Promise<{ loaded: ManuscriptFile[]; failedNames: string[] }> {
    const settled = await Promise.allSettled(sources.map((source) => this.readOne(source)));
    const loaded = settled.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const failed = settled.flatMap((r, i) => (r.status === 'rejected' ? [i] : []));
    return { loaded, failedNames: failed.map((i) => sources[i].name) };
  }

  private async readOne(source: ImportSource): Promise<ManuscriptFile> {
    return { id: this.serial++, name: source.name, content: await source.text() };
  }
}
