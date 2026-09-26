import { Info, Line, List, Success, Text, type CommandProps } from 'decopin-cli';

export default function Command({ data }: CommandProps<'sync-local'>) {
  return (
    <>
      {data.steps.map((s) => (
        <Line key={s.name}>
          <Text color={!s.ran ? 'dim' : s.ok ? 'green' : 'red'}>{!s.ran ? 'skip' : s.ok ? 'ok' : 'failed'}</Text>{' '}
          {s.name}
        </Line>
      ))}
      {data.written.length > 0 && (
        <>
          <Line>zsh config written:</Line>
          <List items={data.written} />
        </>
      )}
      {data.dryRun ? (
        <Info>dry run: nothing changed</Info>
      ) : (
        <Success>synced ({data.profile}). Run `my reload` to pick up the shell config</Success>
      )}
    </>
  );
}
