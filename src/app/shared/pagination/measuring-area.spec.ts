import { describe, expect, it } from 'vitest';
import { buildRenderedDocument } from '../markdown/build-rendered-document';
import { MeasuringArea } from './measuring-area';

const doc = () =>
  buildRenderedDocument([{ fileIndex: 0, fileName: 'a.md', html: '<h1>A</h1><p>a1</p>' }]);

describe('MeasuringArea', () => {
  it('計測後は document.body に痕跡を残さない', () => {
    const before = document.body.children.length;
    new MeasuringArea().measure(doc(), [{ start: 0, end: 2 }]);
    expect(document.body.children.length).toBe(before);
  });

  it('セグメントごとの計測値を返す (jsdom は各 1 ページ)', () => {
    const pagination = new MeasuringArea().measure(doc(), [{ start: 0, end: 2 }]);
    expect(pagination).toEqual({
      segments: [{ start: 0, end: 2, pages: 1, firstPage: 0 }],
      total: 1,
    });
  });

  it('計測中に例外が起きても host を除去する', () => {
    const area = new MeasuringArea();
    const brokenRanges = [
      {
        get start(): number {
          throw new Error('boom');
        },
        end: 1,
      },
    ];
    const before = document.body.children.length;
    expect(() => area.measure(doc(), brokenRanges)).toThrow('boom');
    expect(document.body.children.length).toBe(before);
  });
});
