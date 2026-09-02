import { mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

import type { CommandProps } from 'decopin-cli';

import { computeDrift } from '../_lib/drift.ts';

export default async function Data({ dryRun }: CommandProps<'apply'>) {
  const { profile, drifts } = await computeDrift();
  const changed = drifts.filter((d) => d.kind !== 'same');
  if (!dryRun) {
    for (const d of changed) {
      const target = join(homedir(), d.path);
      await mkdir(dirname(target), { recursive: true });
      await Bun.write(target, d.expected);
    }
  }
  return {
    profile,
    dryRun,
    written: changed.map((d) => d.path),
    unchanged: drifts.filter((d) => d.kind === 'same').map((d) => d.path),
  };
}
