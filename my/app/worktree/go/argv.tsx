import { Argv } from 'decopin-cli';

export default function DefineArgv() {
  return <Argv description="Pick a git worktree and cd into it (remembers where you were)." />;
}
