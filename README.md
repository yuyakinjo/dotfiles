# dotfiles

自作 CLI `my` で管理している zsh 用の dotfiles。

## セットアップ

### 方法1: ワンライナー(新しいマシンで一気にセットアップ)

```bash
curl -fsLS https://raw.githubusercontent.com/yuyakinjo/dotfiles/main/bootstrap.sh | bash
```

[bootstrap.sh](./bootstrap.sh) が Homebrew と zsh 設定が使うツール(starship, eza, zoxide, fzf, fzf-tab, bun)のインストール、
`$HOME/workspace/dotfiles` へのクローンと `my apply` による設定の適用までを一括で行う。

> **注意**: Homebrew の新規インストールでは、`sudo` のパスワード入力を求められることがある。
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
3. zsh 設定が使うツールをインストールする:
   ```bash
   brew install starship eza zoxide fzf fzf-tab oven-sh/bun/bun
   ```
4. `my` をビルドして設定(zsh / starship / Ghostty)を書き出す:
   ```bash
   cd "$HOME/workspace/dotfiles/my" && bun install && bun run link && "$HOME/.local/bin/my" apply
   ```
5. シェルを再読み込みする:
   ```bash
   exec zsh
   ```

詳細な手順は [setup-zsh-dotfiles スキル](./.agents/skills/setup-zsh-dotfiles/SKILL.md) を参照。

## 構成

zsh の設定は **`my` CLI の生成物**。`~/.zshrc` と `~/.zsh/*` はソースではなく `my apply` が書き出す
(`.next/` をコミットしないのと同じ考え方)。ソースは [my/app/_lib/config.ts](./my/app/_lib/config.ts)。
starship / Ghostty の設定も `my apply` が [my/files/](./my/files/) からそのまま書き出す。

```
bootstrap.sh          # ワンライナーセットアップ用スクリプト
my/                    # decopin-cli で作った自分用 CLI。設定の唯一のソース
  app/_lib/config.ts   #   alias / init / 配る zsh 関数の表。profile ごとの差分は spread
  app/<command>/       #   my apply / diff / config / reload / sync / sync-local / pull / profile / cache clean / git tidy|worktree go|back
  zsh/                 #   zsh のまま配る断片(fzf の zle ウィジェット、init)
  files/               #   そのまま配るファイル(starship.toml, Ghostty の config.ghostty)
```

`my --help` でコマンド一覧、`my <command> --help` で使い方が出る。Tab 補完も付く。

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

他のマシンで push した変更は**自動で取り込まれる**。シェル起動時に `my pull` が裏で走り、
前回から 1 時間以上経っていれば `git fetch` して、GitHub に新しいコミットがあれば fast-forward し、
bun install / link / `my apply` まで行う(反映は次に開くシェルから。今のシェルは `my reload`)。
手元に未コミットの変更や未 push のコミットがある場合は作業を潰さないよう何もしない。
結果は `~/.cache/my/pull.log` に残る。

```bash
my pull --force               # 1 時間待たずに今すぐ取り込む
my pull --dry-run             # 何コミット遅れているかだけ見る
my sync-local                 # 手で git pull した後、リポジトリの内容をローカルに反映
```

profile(`personal` / `work` / `server`)は `~/.config/my/device.json` の `{"profile": "work"}` で選ぶ。
`my profile` で今の値が見える。

詳細は [backup-dotfiles スキル](./.agents/skills/backup-dotfiles/SKILL.md)(machine → repo)、
[setup-zsh-dotfiles スキル](./.agents/skills/setup-zsh-dotfiles/SKILL.md)(repo → machine)を参照。

## エージェント向けスキル

`claude` や `codex` などのエージェントから使えるスキルを [.agents/skills/](./.agents/skills/) に用意している
(`.claude/skills`, `.codex/skills` はそこへのシンボリックリンク)。

| スキル | 内容 |
| --- | --- |
| [setup-zsh-dotfiles](./.agents/skills/setup-zsh-dotfiles/SKILL.md) | このリポジトリをクローンして zsh 設定を適用する(repo → machine) |
| [backup-dotfiles](./.agents/skills/backup-dotfiles/SKILL.md) | ローカルの変更をこのリポジトリに取り込んで push する(machine → repo) |
