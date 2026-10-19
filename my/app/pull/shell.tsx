import { homedir } from 'node:os';
import { join } from 'node:path';

import { Shell, type CommandProps } from 'decopin-cli';

export default function ShellChanges({ data }: CommandProps<'pull'>) {
  if (!data.sync || data.sync.written.length === 0) return null;
  return <Shell.Source file={join(homedir(), '.zshrc')} />;
}
