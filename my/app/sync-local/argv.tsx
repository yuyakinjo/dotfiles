import { Argv } from 'decopin-cli';

export default function DefineArgv() {
  return (
    <Argv description="手元のリポジトリの内容を my apply でローカルに反映する (--dry-run で確認のみ)。GitHub から取り込むのは my pull。" />
  );
}
