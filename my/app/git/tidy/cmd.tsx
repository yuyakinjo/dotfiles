import { Info, Line, Success, Table, Text, type CommandProps } from 'decopin-cli';

import type { Verdict } from './data.tsx';

const HOME = process.env.HOME ?? '';

/** 長くなりがちな name は最後の列に。詰まるときにそこから省略される */
function rows(verdicts: Verdict[], dryRun: boolean) {
  return verdicts.map((v) => [
    v.action === 'deleted' ? (dryRun ? 'would delete' : 'deleted') : 'kept',
    v.reason,
    v.name.replace(HOME, '~'),
  ]);
}

export default function Command({ data }: CommandProps<'git/tidy'>) {
  const deleted = [...data.branches, ...data.worktrees].filter((v) => v.action === 'deleted').length;
  return (
    <>
      <Line>
        <Text dim>repo</Text> {data.root.replace(HOME, '~')} <Text dim>on</Text> {data.current || '(detached)'}
        {data.pulled ? <Text dim> (pulled {data.main})</Text> : null}
      </Line>
      {data.branches.length > 0 ? (
        <Table columns={['branch', 'reason', 'name']} rows={rows(data.branches, data.dryRun)} />
      ) : (
        <Line>
          <Text dim>no branches besides {data.main}</Text>
        </Line>
      )}
      {data.worktrees.length > 0 ? (
        <Table columns={['worktree', 'reason', 'path']} rows={rows(data.worktrees, data.dryRun)} />
      ) : null}
      {data.dryRun ? (
        <Info>dry run: nothing deleted</Info>
      ) : (
        <Success>{deleted === 0 ? 'nothing to tidy' : `${deleted} removed`}</Success>
      )}
    </>
  );
}
