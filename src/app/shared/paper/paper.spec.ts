import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { A4 } from './paper-catalog';
import { Paper } from './paper';

describe('Paper', () => {
  it('既定の書式を保有する', () => {
    expect(TestBed.inject(Paper).format()).toBe(A4);
  });

  it('現在の書式を画面 CSS へ反映する', () => {
    TestBed.inject(Paper);
    TestBed.tick();
    expect(document.documentElement.style.getPropertyValue('--page-width')).toBe('210mm');
    expect(document.documentElement.style.getPropertyValue('--content-width')).toBe('178mm');
  });
});
