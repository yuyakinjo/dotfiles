import { missingTool, notFound, type CommandProps } from 'decopin-cli';

import { listWorktrees } from '../../worktree/go/data.tsx';

export type Action = 'deleted' | 'kept';

export interface Verdict {
  name: string;
  action: Action;
  reason: string;
}

const git = (cwd: string, ...args: string[]) =>
  Bun.$`git -C ${cwd} ${args}`.quiet().nothrow();

async function text(cwd: string, ...args: string[]): Promise<string> {
  return (await git(cwd, ...args).text()).trim();
}

async function ok(cwd: string, ...args: string[]): Promise<boolean> {
  return (await git(cwd, ...args)).exitCode === 0;
}

/** origin/HEAD が指す既定ブランチ。取れなければ main */
async function defaultBranch(root: string): Promise<string> {
  const ref = await text(root, 'symbolic-ref', '--short', 'refs/remotes/origin/HEAD');
  return ref === '' ? 'main' : ref.replace(/^origin\//, '');
}

/** ブランチ名を head にした merged な PR 番号 */
async function mergedPr(root: string, branch: string): Promise<number | undefined> {
  const out = await Bun.$`gh pr list --state merged --head ${branch} --json number --jq ${'.[0].number'}`
    .cwd(root)
    .quiet()
    .nothrow()
    .text();
  const number = Number(out.trim());
  return Number.isInteger(number) && number > 0 ? number : undefined;
}

export default async function Data({ cwd, dryRun }: CommandProps<'git/tidy'>) {
  if (Bun.which('gh') === null) {
    missingTool({ tool: 'gh', reason: 'to tell which PRs are merged', install: 'brew install gh' });
  }
  const root = await text(cwd, 'rev-parse', '--show-toplevel');
  if (root === '') notFound({ what: 'git repository', requested: cwd });

  const main = await defaultBranch(root);
  const upstream = `origin/${main}`;
  await git(root, 'fetch', '--prune', '--quiet');

  // 手元の main が origin と同じなら ff で追いつく。他のブランチに居るときは触らない
  const current = await text(root, 'branch', '--show-current');
  const pulled = current === main && !dryRun && (await ok(root, 'pull', '--ff-only', '--quiet'));

  const trees = await listWorktrees(root);
  const checkedOut = new Set(trees.map((t) => t.branch));

  const branches: Verdict[] = [];
  const names = (await text(root, 'for-each-ref', '--format=%(refname:short)', 'refs/heads/'))
    .split('\n')
    .filter((name) => name !== '' && name !== main);
  for (const name of names) {
    if (checkedOut.has(name)) {
      branches.push({ name, action: 'kept', reason: 'checked out in a worktree' });
      continue;
    }
    const pr = await mergedPr(root, name);
    if (pr !== undefined) {
      if (!dryRun) await git(root, 'branch', '-D', name);
      branches.push({ name, action: 'deleted', reason: `PR #${pr} merged` });
    } else if (await ok(root, 'merge-base', '--is-ancestor', name, upstream)) {
      if (!dryRun) await git(root, 'branch', '-d', name);
      branches.push({ name, action: 'deleted', reason: `already in ${upstream}` });
    } else {
      branches.push({ name, action: 'kept', reason: 'no merged PR, not in main' });
    }
  }

  const worktrees: Verdict[] = [];
  for (const tree of trees) {
    if (tree.path === root) continue;
    const dirty = (await text(tree.path, 'status', '--porcelain')) !== '';
    if (dirty) {
      worktrees.push({ name: tree.path, action: 'kept', reason: 'uncommitted changes' });
      continue;
    }
    const head = await text(tree.path, 'rev-parse', 'HEAD');
    if (await ok(root, 'merge-base', '--is-ancestor', head, upstream)) {
      if (!dryRun) await git(root, 'worktree', 'remove', tree.path);
      worktrees.push({ name: tree.path, action: 'deleted', reason: `HEAD already in ${upstream}` });
    } else {
      worktrees.push({ name: tree.path, action: 'kept', reason: 'unmerged commits' });
    }
  }
  if (!dryRun) await git(root, 'worktree', 'prune');

  return { root, main, current, pulled, dryRun, branches, worktrees };
}
