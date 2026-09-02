# dotfiles

[chezmoi](https://www.chezmoi.io/) で管理している zsh 用の dotfiles。

## セットアップ

### 方法1: ワンライナー(新しいマシンで一気にセットアップ)

```bash
curl -fsLS https://raw.githubusercontent.com/yuyakinjo/dotfiles/main/bootstrap.sh | bash
```

[bootstrap.sh](./bootstrap.sh) が Homebrew のインストール、[Brewfile](./Brewfile) に書かれたパッケージの導入、
chezmoi による `$HOME/workspace/dotfiles` へのクローンと設定の適用までを一括で行う。

> **注意**: Homebrew を新規インストールする場合、初回のみ `sudo` のパスワード入力を求められることがある。
> `curl | bash` のパイプ実行では tty が無く入力待ちで止まる場合があるので、その場合はスクリプトを
> 一度ダウンロードしてから `bash bootstrap.sh` として実行すること。

### 方法2: 手動セットアップ

1. Homebrew をインストールする(未インストールの場合):
   ```bash
   command -v brew >/dev/null 2>&1 || /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
2. workspace ディレクトリを作成し、そこに移動してからクローンする:
   ```bash
   mkdir -p "$HOME/workspace"
   cd "$HOME/workspace"
   gh repo clone yuyakinjo/dotfiles || git clone https://github.com/yuyakinjo/dotfiles.git
   cd dotfiles
   ```
3. chezmoi をインストールする(未インストールの場合):
   ```bash
   command -v chezmoi >/dev/null 2>&1 || brew install chezmoi
   ```
4. chezmoi を初期化し、設定を適用する:
   ```bash
   chezmoi init --apply --source "$HOME/workspace/dotfiles" "https://github.com/yuyakinjo/dotfiles.git"
   ```
5. Brewfile のパッケージをインストールする:
   ```bash
   brew bundle --file="$HOME/workspace/dotfiles/Brewfile"
   ```
6. `my` をビルドして zsh の設定を書き出す(bun が要る。Brewfile に入っている):
   ```bash
   cd "$HOME/workspace/dotfiles/my" && bun install && bun run link && "$HOME/.local/bin/my" apply
   ```
7. シェルを再読み込みする:
   ```bash
   exec zsh
   ```

詳細な手順は [setup-zsh-dotfiles スキル](./.agents/skills/setup-zsh-dotfiles/SKILL.md) を参照。

## 構成

zsh の設定は **`my` CLI の生成物**。`~/.zshrc` と `~/.zsh/*` はソースではなく `my apply` が書き出す
(`.next/` をコミットしないのと同じ考え方)。ソースは [my/app/_lib/config.ts](./my/app/_lib/config.ts)。
chezmoi が管理するのは zsh 以外(starship, Ghostty, Brewfile)。

```
bootstrap.sh          # ワンライナーセットアップ用スクリプト
Brewfile               # Homebrew でインストールするパッケージ一覧(brew install/uninstall後に自動更新される)
.chezmoi.toml.tmpl     # chezmoi 設定(sourceDir を ~/workspace/dotfiles に固定)
.chezmoiignore         # my/ は chezmoi の対象外
dot_config/            # starship.toml
private_Library/       # Ghostty の設定
my/                    # decopin-cli で作った自分用 CLI。zsh 設定の唯一のソース
  app/_lib/config.ts   #   alias / init / 配る zsh 関数の表。profile ごとの差分は spread
  app/<command>/       #   my apply / diff / edit / reload / sync / profile / cache clean / worktree go|back
  zsh/                 #   zsh のまま配る断片(brew ラッパー、fzf の zle ウィジェット、init)
```

`my --help` でコマンド一覧、`my <command> --help` で使い方が出る。Tab 補完も付く。

## 設定を変える・同期する

zsh の設定は `~/.zshrc` を直接編集せず、ソースを編集して生成し直す:

```bash
my edit zshrc                # my/app/_lib/config.ts をエディタで開く
cd ~/workspace/dotfiles/my && bun run link   # ビルドして ~/.local/bin/my を更新
my diff                      # 生成物と実ファイルの差分(手編集のドリフトもここで分かる)
my apply                     # 書き出す(--dry-run で何が変わるかだけ)
my reload                    # 今のシェルに反映
my sync "変更内容の説明"      # リポジトリを commit・push
```

profile(`personal` / `work` / `server`)は `~/.config/my/device.json` の `{"profile": "work"}` で選ぶ。
`my profile` で今の値が見える。

詳細は [backup-chezmoi-dotfiles スキル](./.agents/skills/backup-chezmoi-dotfiles/SKILL.md) を参照。

## エージェント向けスキル

`claude` や `codex` などのエージェントから使えるスキルを [.agents/skills/](./.agents/skills/) に用意している
(`.claude/skills`, `.codex/skills` はそこへのシンボリックリンク)。

| スキル | 内容 |
| --- | --- |
| [setup-zsh-dotfiles](./.agents/skills/setup-zsh-dotfiles/SKILL.md) | このリポジトリをクローンして zsh 設定を適用する(repo → machine) |
| [backup-chezmoi-dotfiles](./.agents/skills/backup-chezmoi-dotfiles/SKILL.md) | ローカルの変更をこのリポジトリに取り込んで push する(machine → repo) |
