import { Info, Line, List, Success, Text, type CommandProps } from 'decopin-cli';

const SKIPPED = {
  throttled: 'skipped: pulled within the last hour (--force to override)',
  locked: 'skipped: another my pull is running',
  'fetch-failed': 'git fetch failed',
  'up-to-date': 'already up to date',
  dirty: 'skipped: repository has uncommitted changes',
  diverged: 'skipped: local commits not pushed yet',
  'pull-failed': 'git merge --ff-only failed',
} as const;

export default function Command({ data }: CommandProps<'pull'>) {
  if (data.status !== 'pulled') {
    const behind = data.behind > 0 ? ` (${data.behind} commit(s) behind)` : '';
    return <Info>{SKIPPED[data.status] + behind}</Info>;
  }
  if (data.dryRun || !data.sync) return <Info>dry run: would pull {data.behind} commit(s)</Info>;
  return (
    <>
      <Line>pulled {data.behind} commit(s)</Line>
      {data.sync.steps.map((s) => (
        <Line key={s.name}>
          <Text color={s.ok ? 'green' : 'red'}>{s.ok ? 'ok' : 'failed'}</Text> {s.name}
        </Line>
      ))}
      {data.sync.written.length > 0 && (
        <>
          <Line>written:</Line>
          <List items={data.sync.written} />
        </>
      )}
      <Success>synced ({data.sync.profile})</Success>
    </>
  );
}
