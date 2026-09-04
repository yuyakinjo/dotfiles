import { Argv, Option } from 'decopin-cli';

export default function DefineArgv() {
  return (
    <Argv description="開発用キャッシュ (Homebrew, uv, npm, bun, pnpm) を削除してディスクを空ける。--dry-run はサイズ表示のみ。">
      <Option name="aerials" type="boolean" default={false} description="macOS の空撮壁紙動画も削除する" />
    </Argv>
  );
}
