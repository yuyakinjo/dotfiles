import { homedir } from 'node:os';

import { Line, Text, type CommandProps } from 'decopin-cli';

import { TARGETS } from './argv.tsx';

export default async function Command({ args }: CommandProps<'edit'>) {
  const target = TARGETS[args.target as keyof typeof TARGETS].replace('~', homedir());
  await Bun.spawn(['code', target]).exited;
  return (
    <Line>
      <Text dim>code</Text> {target}
    </Line>
  );
}
