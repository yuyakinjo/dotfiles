import { mkdir, rm, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

import type { CmdProps } from 'decopin-cli';

import { REPO, syncLocal, type SyncResult } from '../_lib/sync-local.ts';

const CACHE = join(homedir(), '.cache', 'my');
const STAMP = join(CACHE, 'last-pull');
const LOCK = join(CACHE, 'pull.lock');
const INTERVAL_MS = 60 * 60 * 1000;
/** 落ちたプロセスが残したロックはこれより古ければ捨てる */
const STALE_LOCK_MS = 10 * 60 * 1000;

export type PullStatus = 'throttled' | 'locked' | 'fetch-failed' | 'up-to-date' | 'dirty' | 'diverged' | 'pull-failed' | 'pulled';

export interface PullResult {
  dryRun: boolean;
  status: PullStatus;
  behind: number;
  sync?: SyncResult;
}

async function git(args: string[]) {
  return Bun.$`git -C ${REPO} ${args}`.quiet().nothrow();
}

async function ageMs(path: string): Promise<number> {
  try {
    return Date.now() - (await stat(path)).mtimeMs;
  } catch {
    return Infinity;
  }
}

/** mkdir はアトミックなので、複数のシェルが同時に起動しても 1 つだけが通る */
async function acquireLock(): Promise<boolean> {
  await mkdir(CACHE, { recursive: true });
  if ((await ageMs(LOCK)) > STALE_LOCK_MS) await rm(LOCK, { recursive: true, force: true });
  try {
    await mkdir(LOCK);
    return true;
  } catch {
    return false;
  }
}

async function pull(dryRun: boolean): Promise<PullResult> {
  if ((await git(['fetch', '-q'])).exitCode !== 0) return { dryRun, status: 'fetch-failed', behind: 0 };

  const counts = (await git(['rev-list', '--left-right', '--count', 'HEAD...@{u}'])).text().trim().split(/\s+/);
  const ahead = Number(counts[0] ?? 0);
  const behind = Number(counts[1] ?? 0);
  if (behind === 0) return { dryRun, status: 'up-to-date', behind: 0 };
  // 編集中のマシンで作業を潰さない: 手元に変更やローカルコミットがあれば触らない
  if (ahead > 0) return { dryRun, status: 'diverged', behind };
  if ((await git(['status', '--porcelain'])).text().trim() !== '') return { dryRun, status: 'dirty', behind };
  if (dryRun) return { dryRun, status: 'pulled', behind };

  if ((await git(['merge', '--ff-only', '-q', '@{u}'])).exitCode !== 0) return { dryRun, status: 'pull-failed', behind };
  return { dryRun, status: 'pulled', behind, sync: await syncLocal(false) };
}

export default async function Data({ options, dryRun }: CmdProps<'pull'>): Promise<PullResult> {
  if (!options.force && !dryRun && (await ageMs(STAMP)) < INTERVAL_MS) return { dryRun, status: 'throttled', behind: 0 };
  if (!(await acquireLock())) return { dryRun, status: 'locked', behind: 0 };
  try {
    if (!dryRun) await Bun.write(STAMP, new Date().toISOString());
    return await pull(dryRun);
  } finally {
    await rm(LOCK, { recursive: true, force: true });
  }
}
