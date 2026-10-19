import { Argv } from 'decopin-cli';

export default function DefineArgv() {
  return (
    <Argv description="git pull 後、chezmoi apply / my apply でリポジトリの変更をローカルに反映する (--dry-run で確認のみ)。" />
  );
}
