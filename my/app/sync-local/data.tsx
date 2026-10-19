import type { CommandProps } from 'decopin-cli';

import { syncLocal } from '../_lib/sync-local.ts';

export default async function Data({ dryRun }: CommandProps<'sync-local'>) {
  return { dryRun, ...(await syncLocal(dryRun)) };
}
