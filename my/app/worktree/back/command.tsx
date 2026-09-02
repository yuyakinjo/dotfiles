import { Line, Text, type CommandProps } from 'decopin-cli';

export default function Command({ data }: CommandProps<'worktree/back'>) {
  return (
    <Line>
      <Text dim>cd</Text> {data.to}
    </Line>
  );
}
