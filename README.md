# dotfiles

[chezmoi](https://www.chezmoi.io/) で管理している zsh 用の dotfiles。

## セットアップ

### 方法1: ワンライナー(新しいマシンで一気にセットアップ)

```bash
curl -fsLS https://raw.githubusercontent.com/yuyakinjo/dotfiles/main/bootstrap.sh | bash
```

[bootstrap.sh](./bootstrap.sh) が Homebrew のインストール、[Brewfile](./Brewfile) と
[Brewfile.zerobrew](./Brewfile.zerobrew) に書かれたパッケージの導入、
chezmoi による `$HOME/workspace/dotfiles` へのクローンと設定の適用までを一括で行う。

> **注意**: Homebrew の新規インストールや zerobrew の初期化では、`sudo` のパスワード入力を求められることがある。
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
   command brew bundle --file="$HOME/workspace/dotfiles/Brewfile"
   # zerobrew の一覧にパッケージがある場合だけ復元する
   if grep -Eq '^[[:space:]]*(brew|cask)[[:space:]]' "$HOME/workspace/dotfiles/Brewfile.zerobrew"; then
     zb init --no-modify-path
     zb bundle install --file="$HOME/workspace/dotfiles/Brewfile.zerobrew"
   fi
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
Brewfile               # Homebrew 管理のパッケージ一覧
Brewfile.zerobrew      # zerobrew 管理のパッケージ一覧(両方とも brew 経由の変更後に自動更新)
.chezmoi.toml.tmpl     # chezmoi 設定(sourceDir を ~/workspace/dotfiles に固定)
.chezmoiignore         # my/ は chezmoi の対象外
dot_config/            # starship.toml
private_Library/       # Ghostty の設定
my/                    # decopin-cli で作った自分用 CLI。zsh 設定の唯一のソース
  app/_lib/config.ts   #   alias / init / 配る zsh 関数の表。profile ごとの差分は spread
  app/<command>/       #   my apply / diff / config / reload / sync / profile / cache clean / git tidy|worktree go|back
  zsh/                 #   zsh のまま配る断片(brew ラッパー、fzf の zle ウィジェット、init)
```

`my --help` でコマンド一覧、`my <command> --help` で使い方が出る。Tab 補完も付く。

## Homebrew と zerobrew の併用

`brew` は alias ではなく zsh 関数。zerobrew 0.4 に対応するコマンド・オプションは `zb` へ、
未対応のもの(`services`, `tap`, `reinstall`, `list --versions`, `install --cask` など)は Homebrew へ送る。
`zb` が無いマシンでは、すべて Homebrew で実行する。zb の失敗時に本家で再試行はしない。

初回は `zb init --no-modify-path` を実行する(`sudo` が必要な場合あり)。
PATH は `my/zsh/init.zsh` が管理するため、zb に生成済みの `.zshrc` を変更させない。

```sh
brew install jq                     # zb でインストール
brew services list                  # 本家へフォールバック
brew bundle check                   # zb にないサブコマンドも本家へ
brew --homebrew upgrade zerobrew     # 本家で実行し、自動バックアップも維持
command brew list                   # ラッパーを完全に迂回(自動バックアップなし)
```

両者のパッケージ管理情報は独立している。本家で入れた既存パッケージを操作・確認するときは
`brew --homebrew ...` を使う。既存パッケージの移行は自動では行わない。
`brew bundle [install|dump]` の zb 側のデフォルトファイルは、カレントディレクトリの
`Brewfile.zerobrew`。`--file` / `-f` で明示したパスはそのまま使う。

`brew` 経由で install / uninstall / reinstall / upgrade / bundle install / migrate / reset / tap / untap が
成功すると、chezmoi のソースディレクトリの両ファイルをそれぞれのマネージャーから更新する。
未初期化の zb の一覧は上書きせず、dump 失敗時にも以前のファイルを残す。
`zb ...` や `command brew ...` の直接実行には自動更新は付かない。

検証: `cd my && bun test` (パッケージ操作はモックし、実際のインストール状態を変えない)。

## 設定を変える・同期する

zsh の設定は `~/.zshrc` を直接編集せず、ソースを編集して生成し直す:

```bash
my config zshrc              # my/app/_lib/config.ts をエディタで開く
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
