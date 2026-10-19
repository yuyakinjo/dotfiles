import { homedir } from 'node:os';
import { join } from 'node:path';

import type { CmdProps } from 'decopin-cli';

const HOME = homedir();
const AERIALS = join(HOME, 'Library/Application Support/com.apple.wallpaper/aerials/videos');

interface Target {
  name: string;
  path: string;
  /** 消すコマンド。無ければ path を rm */
  clean?: string[];
}

const TARGETS: Target[] = [
  { name: 'Homebrew', path: join(HOME, 'Library/Caches/Homebrew'), clean: ['brew', 'cleanup', '--prune=all'] },
  { name: 'uv', path: join(HOME, '.cache/uv'), clean: ['uv', 'cache', 'clean'] },
  { name: 'npm', path: join(HOME, '.npm/_cacache'), clean: ['npm', 'cache', 'clean', '--force'] },
  { name: 'bun', path: join(HOME, '.bun/install/cache'), clean: ['bun', 'pm', 'cache', 'rm'] },
  { name: 'pnpm', path: join(HOME, 'Library/pnpm'), clean: ['pnpm', 'store', 'prune'] },
];

async function sizeOf(path: string): Promise<string | undefined> {
  if (!(await Bun.file(path).exists()) && !(await isDirectory(path))) return undefined;
  const out = await Bun.$`du -xsh ${path}`.quiet().nothrow().text();
  return out.trim().split(/\s+/)[0] || undefined;
}

async function isDirectory(path: string): Promise<boolean> {
  try {
    return (await Bun.$`test -d ${path}`.quiet().nothrow()).exitCode === 0;
  } catch {
    return false;
  }
}

async function freeKb(): Promise<number | undefined> {
  const out = await Bun.$`df -k /System/Volumes/Data`.quiet().nothrow().text();
  const value = Number(out.split('\n')[1]?.split(/\s+/)[3]);
  return Number.isFinite(value) ? value : undefined;
}

export type Status = 'running' | 'done' | 'skipped';

export interface Row {
  name: string;
  path: string;
  size: string | undefined;
  status: Status;
}

export interface Progress {
  /** 終わった順に並ぶ。running は末尾 */
  rows: Row[];
  freedGb: number | undefined;
  /** 全件終わり、空き容量も測り終えた */
  settled: boolean;
}

/** 1 件消す。コマンドが無ければ skipped */
async function cleanOne(t: Target): Promise<Status> {
  if (t.clean !== undefined) {
    if (Bun.which(t.clean[0] as string) === null) return 'skipped';
    await Bun.spawn(t.clean, { stdout: 'ignore', stderr: 'ignore' }).exited;
    return 'done';
  }
  if (!(await isDirectory(t.path))) return 'skipped';
  await Bun.$`rm -f -- ${t.path}/*.mov`.quiet().nothrow();
  await Bun.$`killall WallpaperAgent idleassetsd`.quiet().nothrow();
  return 'done';
}

/** 並列に消し、終わるたびに終わった順の一覧を流す */
async function* cleanAll(targets: Target[], before: Row[]): AsyncGenerator<Progress> {
  const freeBefore = await freeKb();
  const finished: Row[] = [];
  const running = new Map(before.map((r) => [r.name, r]));
  const snapshot = (settled = false, freedGb?: number): Progress => ({
    rows: [...finished, ...running.values()],
    freedGb,
    settled,
  });
  yield snapshot();

  const pending = new Map(
    targets.map((t) => [t.name, cleanOne(t).then((status) => ({ name: t.name, status }))])
  );
  while (pending.size > 0) {
    const { name, status } = await Promise.race(pending.values());
    pending.delete(name);
    const row = running.get(name) as Row;
    running.delete(name);
    finished.push({ ...row, status });
    yield snapshot();
  }

  const freeAfter = await freeKb();
  yield snapshot(
    true,
    freeBefore !== undefined && freeAfter !== undefined
      ? Math.round(((freeAfter - freeBefore) / 1048576) * 10) / 10
      : undefined
  );
}

export default async function Data({ options, dryRun }: CmdProps<'cache/clean'>) {
  const targets = options.aerials ? [...TARGETS, { name: 'aerials', path: AERIALS }] : TARGETS;
  const before: Row[] = await Promise.all(
    targets.map(async (t) => ({
      name: t.name,
      path: t.path,
      size: await sizeOf(t.path),
      status: 'running' as Status,
    }))
  );
  if (dryRun) return { dryRun, targets: before, progress: undefined };
  return { dryRun, targets: before, progress: cleanAll(targets, before) };
}
