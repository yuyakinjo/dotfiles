import { Argv } from 'decopin-cli';

export default function DefineArgv() {
  return <Argv description="git worktree を選んで cd する (元の場所を記憶する)。" />;
}
