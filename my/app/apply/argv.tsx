import { Argv } from 'decopin-cli';

export default function DefineArgv() {
  return <Argv description="生成した ~/.zshrc と ~/.zsh/* を書き出す (--dry-run で確認のみ)。" />;
}
