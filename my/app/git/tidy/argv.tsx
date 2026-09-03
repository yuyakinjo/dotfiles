import { Argv } from 'decopin-cli';

export default function DefineArgv() {
  return (
    <Argv description="Delete local branches whose PR is merged and worktrees that are clean and already in main. --dry-run only shows what would go." />
  );
}
