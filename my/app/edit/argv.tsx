import { Arg, Argv, Type } from 'decopin-cli';

export const TARGETS = {
  zshrc: '~/workspace/dotfiles/my/app/_lib/config.ts',
  codex: '~/.codex/config.toml',
  claude: '~/.claude/settings.json',
  starship: '~/.config/starship.toml',
} as const;

export default function DefineArgv() {
  return (
    <Argv description="Open a config file in the editor.">
      <Arg name="target" required description="which file">
        <Type.Enum values={Object.keys(TARGETS)} />
      </Arg>
    </Argv>
  );
}
