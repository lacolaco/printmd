import { describe, expect, it } from 'vitest';
import { buildRenderedDocument } from '../markdown/block-extractor';
import { A4 } from '../paper/paper-catalog';
import { Probe } from './probe';

const doc = () =>
  buildRenderedDocument([{ fileIndex: 0, fileName: 'a.md', html: '<h1>A</h1><p>a1</p>' }]);

describe('Probe', () => {
  it('計測後は document.body に痕跡を残さない', () => {
    const before = document.body.children.length;
    new Probe().measure(doc(), [{ start: 0, end: 2 }], A4);
    expect(document.body.children.length).toBe(before);
  });

  it('セグメントごとの計測値を返す (jsdom は各 1 ページ)', () => {
    const pagination = new Probe().measure(doc(), [{ start: 0, end: 2 }], A4);
    expect(pagination).toEqual({
      segments: [{ start: 0, end: 2, pages: 1, firstPage: 0 }],
      total: 1,
    });
  });

  it('計測中に例外が起きても host を除去する', () => {
    const probe = new Probe();
    const brokenRanges = [
      {
        get start(): number {
          throw new Error('boom');
        },
        end: 1,
      },
    ];
    const before = document.body.children.length;
    expect(() => probe.measure(doc(), brokenRanges, A4)).toThrow('boom');
    expect(document.body.children.length).toBe(before);
  });
});
