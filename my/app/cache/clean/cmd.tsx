import { Dynamic, Info, Line, Spinner, Success, Table, type CommandProps } from 'decopin-cli';

import type { Row } from './data.tsx';

const MARK = { running: '…', done: '✓', skipped: '-' } as const;

function Rows({ rows, mark = true }: { rows: Row[]; mark?: boolean }) {
  return (
    <Table
      columns={[...(mark ? [''] : []), 'cache', 'size', 'path']}
      rows={rows.map((r) => [
        ...(mark ? [MARK[r.status]] : []),
        r.name,
        r.size ?? '-',
        r.path.replace(process.env.HOME ?? '', '~'),
      ])}
    />
  );
}

export default function Command({ data }: CommandProps<'cache/clean'>) {
  if (data.progress === undefined) {
    return (
      <>
        <Rows rows={data.targets} mark={false} />
        <Info>dry run: nothing deleted</Info>
      </>
    );
  }
  return (
    <Dynamic source={data.progress} interval={100}>
      {(p) => (
        <>
          <Rows rows={p.rows} />
          {p.settled ? (
            <Success>done{p.freedGb === undefined ? '' : ` (+${p.freedGb} GB free)`}</Success>
          ) : (
            <Line>
              <Spinner /> cleaning {p.rows.filter((r) => r.status === 'running').length} caches
            </Line>
          )}
        </>
      )}
    </Dynamic>
  );
}
