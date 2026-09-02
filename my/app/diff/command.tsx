import { Exit, Line, Symbol, Text, type CommandProps } from 'decopin-cli';

import { computeDrift, diffLines } from '../_lib/drift.ts';

export default async function Command({ data }: CommandProps<'diff'>) {
  const { drifts } = await computeDrift();
  const changed = drifts.filter((d) => d.kind !== 'same');
  return (
    <>
      <Line>
        <Text dim>profile</Text> {data.profile}
      </Line>
      {drifts.map((d) => (
        <Line key={d.path}>
          <Symbol kind={d.kind === 'same' ? 'success' : 'warn'} /> {d.path}
          {d.kind === 'same' ? null : <Text dim> ({d.kind})</Text>}
        </Line>
      ))}
      {changed.map((d) => (
        <>
          <Line />
          <Line>
            <Text bold>--- ~/{d.path}</Text>
          </Line>
          {diffLines(d.actual ?? '', d.expected).map((line, index) =>
            line.kind === ' ' ? null : (
              <Line key={index}>
                <Text color={line.kind === '+' ? 'green' : 'red'}>
                  {line.kind} {line.text}
                </Text>
              </Line>
            )
          )}
        </>
      ))}
      {changed.length > 0 ? <Exit code={1} /> : null}
    </>
  );
}
