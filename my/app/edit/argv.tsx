import { Arg, Argv, Type } from 'decopin-cli';

export const TARGETS = {
  zshrc: '~/workspace/dotfiles/my/app/_lib/config.ts',
  codex: '~/.codex/config.toml',
  claude: '~/.claude/settings.json',
  starship: '~/.config/starship.toml',
} as const;

export default function DefineArgv() {
  return (
    <Argv description="設定ファイルをエディタで開く。">
      <Arg name="target" required description="開くファイル">
        <Type.Enum values={Object.keys(TARGETS)} />
      </Arg>
    </Argv>
  );
}
