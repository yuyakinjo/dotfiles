import { homedir } from 'node:os';
import { join } from 'node:path';

import type { CommandProps } from 'decopin-cli';

const REPO = join(homedir(), 'workspace', 'dotfiles');

async function git(args: string[]) {
  return Bun.$`git -C ${REPO} ${args}`.quiet().nothrow();
}

export default async function Data({ args, dryRun }: CommandProps<'sync'>) {
  const status = (await git(['status', '--porcelain'])).text().trimEnd();
  // 各行は `XY path`。先頭の空白も状態なので行ごとに 3 文字目から読む
  const changed = status === '' ? [] : status.split('\n').map((line) => line.slice(3));
  if (changed.length === 0 || dryRun) return { dryRun, changed, committed: false, pushed: false };
  await git(['add', '-A']);
  const committed = (await git(['commit', '-q', '-m', args.message])).exitCode === 0;
  const pushed = committed && (await git(['push', '-q'])).exitCode === 0;
  return { dryRun, changed, committed, pushed };
}
