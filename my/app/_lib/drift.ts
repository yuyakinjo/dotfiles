/** 生成物と実ファイルの差 (`my diff` / `my apply` が使う) */
import { homedir } from 'node:os';
import { join } from 'node:path';

import { CONFIGS } from './config.ts';
import { generate } from './generate.ts';
import { readDevice } from './profile.ts';

export type DriftKind = 'same' | 'changed' | 'missing';

export interface Drift {
  /** $HOME からの相対パス */
  path: string;
  kind: DriftKind;
  expected: string;
  actual: string | undefined;
}

export async function computeDrift(): Promise<{ profile: string; drifts: Drift[] }> {
  const device = await readDevice();
  const files = generate(CONFIGS[device.profile]);
  const drifts: Drift[] = [];
  for (const [path, expected] of Object.entries(files)) {
    const file = Bun.file(join(homedir(), path));
    const actual = (await file.exists()) ? await file.text() : undefined;
    drifts.push({
      path,
      expected,
      actual,
      kind: actual === undefined ? 'missing' : actual === expected ? 'same' : 'changed',
    });
  }
  return { profile: device.profile, drifts };
}

/** 行単位の LCS diff。表示用なので賢さより読みやすさ */
export type DiffLine = { kind: ' ' | '+' | '-'; text: string };

export function diffLines(before: string, after: string): DiffLine[] {
  const a = before.split('\n');
  const b = after.split('\n');
  const table: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0)
  );
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      table[i]![j] =
        a[i] === b[j]
          ? table[i + 1]![j + 1]! + 1
          : Math.max(table[i + 1]![j]!, table[i]![j + 1]!);
    }
  }
  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      out.push({ kind: ' ', text: a[i]! });
      i += 1;
      j += 1;
    } else if (table[i + 1]![j]! >= table[i]![j + 1]!) {
      out.push({ kind: '-', text: a[i]! });
      i += 1;
    } else {
      out.push({ kind: '+', text: b[j]! });
      j += 1;
    }
  }
  while (i < a.length) out.push({ kind: '-', text: a[i++]! });
  while (j < b.length) out.push({ kind: '+', text: b[j++]! });
  return out;
}
