import { Shell, type CommandProps } from 'decopin-cli';

export default function ShellChanges({ data }: CommandProps<'worktree/back'>) {
  return (
    <>
      <Shell.Cd to={data.to} />
      <Shell.Unset name="MY_WORKTREE_PREV" />
    </>
  );
}
