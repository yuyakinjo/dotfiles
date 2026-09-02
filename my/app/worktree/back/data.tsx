import { notFound } from 'decopin-cli';

export default function Data() {
  const previous = process.env.MY_WORKTREE_PREV;
  if (previous === undefined || previous === '') {
    notFound({ what: 'previous worktree location', requested: '$MY_WORKTREE_PREV' });
  }
  return { to: previous };
}
