import { Info, Success, Table, type CommandProps } from 'decopin-cli';

export default function Command({ data }: CommandProps<'cache/clean'>) {
  return (
    <>
      <Table
        columns={['cache', 'size', 'path']}
        rows={data.targets.map((t) => [
          t.name,
          t.size ?? '-',
          t.path.replace(process.env.HOME ?? '', '~'),
        ])}
      />
      {data.dryRun ? (
        <Info>dry run: nothing deleted</Info>
      ) : (
        <Success>done{data.freedGb === undefined ? '' : ` (+${data.freedGb} GB free)`}</Success>
      )}
    </>
  );
}
