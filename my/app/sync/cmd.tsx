import { Info, Line, List, Success, type CmdProps } from 'decopin-cli';

export default function Command({ data }: CmdProps<'sync'>) {
  if (data.changed.length === 0) return <Info>nothing to sync</Info>;
  return (
    <>
      <Line>changed:</Line>
      <List items={data.changed} />
      {data.dryRun ? (
        <Info>dry run: not committed</Info>
      ) : data.pushed ? (
        <Success>committed and pushed</Success>
      ) : (
        <Info>{data.committed ? 'committed, push failed' : 'commit failed'}</Info>
      )}
    </>
  );
}
