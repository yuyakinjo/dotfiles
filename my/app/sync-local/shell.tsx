import { homedir } from 'node:os';
import { join } from 'node:path';

import { Shell, type CmdProps } from 'decopin-cli';

export default function ShellChanges({ data }: CmdProps<'sync-local'>) {
  if (data.dryRun || data.written.length === 0) return null;
  return <Shell.Source file={join(homedir(), '.zshrc')} />;
}
