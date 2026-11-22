import { describe, expect, it } from 'vitest';
import { compareToBaseline, toBaseline } from './ratchet.mjs';

describe('compareToBaseline', () => {
  it('holds when every file is at its baseline', () => {
    expect(compareToBaseline({ 'a.ts': 2 }, { 'a.ts': 2, 'b.ts': 0 })).toEqual({ increased: [], tightened: [] });
  });

  it('flags files that gained comments, including files missing from the baseline', () => {
    const { increased } = compareToBaseline({ 'a.ts': 1 }, { 'a.ts': 2, 'new.ts': 1 });
    expect(increased).toEqual([
      { file: 'a.ts', allowed: 1, actual: 2 },
      { file: 'new.ts', allowed: 0, actual: 1 },
    ]);
  });

  it('flags files whose baseline can tighten, including deleted files', () => {
    const { tightened } = compareToBaseline({ 'a.ts': 3, 'gone.ts': 1 }, { 'a.ts': 1 });
    expect(tightened).toEqual([
      { file: 'a.ts', allowed: 3, actual: 1 },
      { file: 'gone.ts', allowed: 1, actual: 0 },
    ]);
  });
});

describe('toBaseline', () => {
  it('keeps only files with comments, sorted by path', () => {
    expect(Object.entries(toBaseline({ 'z.ts': 1, 'a.ts': 0, 'm.ts': 4 }))).toEqual([
      ['m.ts', 4],
      ['z.ts', 1],
    ]);
  });
});
