import { homedir } from 'node:os';
import { join } from 'node:path';

import type { CommandProps } from 'decopin-cli';

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
  return out.split(/\s+/)[0] || undefined;
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

export default async function Data({ options, dryRun }: CommandProps<'cache/clean'>) {
  const targets = options.aerials ? [...TARGETS, { name: 'aerials', path: AERIALS }] : TARGETS;
  const before = await Promise.all(
    targets.map(async (t) => ({ name: t.name, path: t.path, size: await sizeOf(t.path) }))
  );
  if (dryRun) return { dryRun, targets: before, freedGb: undefined };

  const freeBefore = await freeKb();
  for (const t of targets) {
    if (t.clean !== undefined) {
      if (Bun.which(t.clean[0] as string) === null) continue;
      await Bun.spawn(t.clean, { stdout: 'ignore', stderr: 'ignore' }).exited;
    } else if (await isDirectory(t.path)) {
      await Bun.$`rm -f -- ${t.path}/*.mov`.quiet().nothrow();
      await Bun.$`killall WallpaperAgent idleassetsd`.quiet().nothrow();
    }
  }
  const freeAfter = await freeKb();
  const freedGb =
    freeBefore !== undefined && freeAfter !== undefined
      ? Math.round(((freeAfter - freeBefore) / 1048576) * 10) / 10
      : undefined;
  return { dryRun, targets: before, freedGb };
}
