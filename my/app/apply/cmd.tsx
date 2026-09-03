import { Info, Line, Success, Text, type CommandProps } from 'decopin-cli';

export default function Command({ data }: CommandProps<'apply'>) {
  if (data.written.length === 0) {
    return <Success>everything is already in place ({data.profile})</Success>;
  }
  return (
    <>
      {data.written.map((path) => (
        <Line key={path}>
          <Text color={data.dryRun ? 'yellow' : 'green'}>{data.dryRun ? 'would write' : 'wrote'}</Text> ~/{path}
        </Line>
      ))}
      {data.dryRun ? (
        <Info>dry run: nothing changed</Info>
      ) : (
        <Success>{data.written.length} file(s) written. Run `my reload` to pick them up</Success>
      )}
    </>
  );
}
