import { Argv } from 'decopin-cli';

export default function DefineArgv() {
  return <Argv description="現在のシェルで ~/.zshrc を読み込み直す。" />;
}
