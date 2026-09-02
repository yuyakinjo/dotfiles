import { Shell, type CommandProps } from 'decopin-cli';

export default function ShellChanges({ data }: CommandProps<'worktree/go'>) {
  return (
    <>
      <Shell.Export name="MY_WORKTREE_PREV" value={data.from} />
      <Shell.Cd to={data.to} />
    </>
  );
}
