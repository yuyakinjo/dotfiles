import { Line, Text, type CommandProps } from 'decopin-cli';

export default function Command({ data }: CommandProps<'worktree/go'>) {
  return (
    <Line>
      <Text dim>cd</Text> {data.to} <Text dim>({data.branch})</Text>
    </Line>
  );
}
