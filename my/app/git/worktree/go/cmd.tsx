import { Line, Text, type CmdProps } from 'decopin-cli';

export default function Command({ data }: CmdProps<'git/worktree/go'>) {
  return (
    <Line>
      <Text dim>cd</Text> {data.to} <Text dim>({data.branch})</Text>
    </Line>
  );
}
