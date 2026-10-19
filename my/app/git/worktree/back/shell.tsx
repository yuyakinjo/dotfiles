import { Shell, type CmdProps } from 'decopin-cli';

export default function ShellChanges({ data }: CmdProps<'git/worktree/back'>) {
  return (
    <>
      <Shell.Cd to={data.to} />
      <Shell.Unset name="MY_WORKTREE_PREV" />
    </>
  );
}
