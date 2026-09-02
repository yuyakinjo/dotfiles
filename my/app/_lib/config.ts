/**
 * dotfiles の「ソース」。ここを変えて `my apply` すると `.zshrc` が変わる。
 *
 * 手癖の短い alias は alias のまま (CLI にすると起動コストが体感に乗る)。
 * 発見可能であるべきものは `my <command>` になっているので、ここには無い。
 */
import type { Profile } from './profile.ts';

export interface ZshConfig {
  /** `alias name="command"` になる */
  aliases: Record<string, string>;
  /** `.zsh/init.zsh` に先頭から入る初期化 (starship, zoxide, fzf ...) */
  init: string;
  /** `.zsh/functions/<name>.zsh` としてそのまま配る zsh 関数 */
  functions: Record<string, string>;
}

import brew from '../../zsh/brew.zsh' with { type: 'text' };
import fzfHistory from '../../zsh/fzf-history-widget.zsh' with { type: 'text' };
import initZsh from '../../zsh/init.zsh' with { type: 'text' };

const base: ZshConfig = {
  aliases: {
    ls: 'eza --icons --group-directories-first -1',
    ll: 'eza -l --icons --group-directories-first',
    la: 'eza -la --icons --group-directories-first',
    lt: 'eza --tree --icons --group-directories-first',
    '..': 'cd ..',
    '...': 'cd ../..',
    '....': 'cd ../../..',
    '.....': 'cd ../../../..',
  },
  init: initZsh,
  functions: {
    brew,
    'fzf-history-widget': fzfHistory,
  },
};

/** profile ごとの差分は spread で書く。テンプレート言語は要らない */
export const CONFIGS: Record<Profile, ZshConfig> = {
  personal: base,
  work: base,
  server: {
    ...base,
    // サーバに eza は無いことが多い
    aliases: Object.fromEntries(
      Object.entries(base.aliases).filter(([name]) => !['ls', 'll', 'la', 'lt'].includes(name))
    ),
    functions: {},
  },
};
