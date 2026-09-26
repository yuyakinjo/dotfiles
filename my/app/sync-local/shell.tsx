import { homedir } from 'node:os';
import { join } from 'node:path';

import { Shell, type CommandProps } from 'decopin-cli';

export default function ShellChanges({ data }: CommandProps<'sync-local'>) {
  if (data.dryRun || data.written.length === 0) return null;
  return <Shell.Source file={join(homedir(), '.zshrc')} />;
}
