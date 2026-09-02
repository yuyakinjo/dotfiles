import { Argv } from 'decopin-cli';

export default function DefineArgv() {
  return <Argv description="Write the generated ~/.zshrc and ~/.zsh/* (use --dry-run to only look)." />;
}
