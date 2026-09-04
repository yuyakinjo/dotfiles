import { Argv } from 'decopin-cli';

export default function DefineArgv() {
  return (
    <Argv description="PR がマージ済みのローカルブランチと、クリーンで main に取り込み済みの worktree を削除する。--dry-run は対象の表示のみ。" />
  );
}
