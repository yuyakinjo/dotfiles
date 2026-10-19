import type { CmdProps } from 'decopin-cli';

import { syncLocal } from '../_lib/sync-local.ts';

export default async function Data({ dryRun }: CmdProps<'sync-local'>) {
  return { dryRun, ...(await syncLocal(dryRun)) };
}
