import { homedir } from 'node:os';
import { join } from 'node:path';

import { Shell } from 'decopin-cli';

// Shell.* の値はクォートされて渡るので $HOME や ~ は展開されない。絶対パスで渡す
export default function ShellChanges() {
  return <Shell.Source file={join(homedir(), '.zshrc')} />;
}
