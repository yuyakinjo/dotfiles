import { Line, Text, type CmdProps } from 'decopin-cli';

export default function Command({ data }: CmdProps<'git/worktree/back'>) {
  return (
    <Line>
      <Text dim>cd</Text> {data.to}
    </Line>
  );
}
