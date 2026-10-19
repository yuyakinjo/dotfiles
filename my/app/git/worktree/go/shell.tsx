import { Shell, type CmdProps } from 'decopin-cli';

export default function ShellChanges({ data }: CmdProps<'git/worktree/go'>) {
  return (
    <>
      <Shell.Export name="MY_WORKTREE_PREV" value={data.from} />
      <Shell.Cd to={data.to} />
    </>
  );
}
