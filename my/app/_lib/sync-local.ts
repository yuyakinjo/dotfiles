/** リポジトリの中身をローカルに反映する (`my sync-local` / `my pull` が使う) */
import { mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

export const REPO = join(homedir(), 'workspace', 'dotfiles');

export interface Step {
  name: string;
  ran: boolean;
  ok: boolean;
}

export interface SyncResult {
  profile: string;
  steps: Step[];
  written: string[];
}

async function run(cmd: string[], cwd: string): Promise<boolean> {
  const proc = Bun.spawn(cmd, { cwd, stdout: 'ignore', stderr: 'ignore' });
  return (await proc.exited) === 0;
}

export async function syncLocal(dryRun: boolean): Promise<SyncResult> {
  const steps: Step[] = [];

  const myDir = join(REPO, 'my');
  const installOk = !dryRun && (await run(['bun', 'install'], myDir));
  steps.push({ name: 'bun install', ran: !dryRun, ok: installOk });
  const linkOk = installOk && (await run(['bun', 'run', 'link'], myDir));
  steps.push({ name: 'bun run link', ran: !dryRun, ok: linkOk });

  // 実行中の dist は pull 前のビルドなので、生成元はリポジトリのソースから読み直す。
  const { computeDrift }: typeof import('./drift.ts') = await import(join(myDir, 'app', '_lib', 'drift.ts'));
  const { profile, drifts } = await computeDrift();
  const changed = drifts.filter((d) => d.kind !== 'same');
  if (!dryRun) {
    for (const d of changed) {
      const target = join(homedir(), d.path);
      await mkdir(dirname(target), { recursive: true });
      await Bun.write(target, d.expected);
    }
  }

  return { profile, steps, written: changed.map((d) => d.path) };
}
