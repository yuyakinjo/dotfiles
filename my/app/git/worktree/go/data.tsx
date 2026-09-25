import { choose, notFound } from 'decopin-cli';

export interface Worktree {
  path: string;
  branch: string;
}

export async function listWorktrees(cwd: string): Promise<Worktree[]> {
  const out = await Bun.$`git -C ${cwd} worktree list --porcelain`.quiet().nothrow().text();
  const trees: Worktree[] = [];
  let current: Partial<Worktree> = {};
  for (const line of out.split('\n')) {
    if (line.startsWith('worktree ')) current = { path: line.slice(9) };
    else if (line.startsWith('branch ')) current.branch = line.slice(7).replace('refs/heads/', '');
    else if (line === 'detached') current.branch = '(detached)';
    else if (line === '' && current.path !== undefined) {
      trees.push({ path: current.path, branch: current.branch ?? '(no branch)' });
      current = {};
    }
  }
  return trees;
}

export default async function Data({ cwd }: { cwd: string }) {
  const trees = await listWorktrees(cwd);
  if (trees.length === 0) notFound({ what: 'git worktree', requested: cwd });
  const labels = trees.map((t) => `${t.branch}  ${t.path}`);
  const picked = await choose('Which worktree?', labels, {
    hint: 'Run this in a terminal; it needs to ask',
  });
  const target = trees[labels.indexOf(picked)] as Worktree;
  return { from: cwd, to: target.path, branch: target.branch };
}
