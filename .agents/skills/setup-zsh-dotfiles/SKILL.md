---
name: setup-zsh-dotfiles
description: 'yuyakinjo/dotfiles を $HOME/workspace にクローンし、Homebrew でツールを揃え、`my` CLI(decopin-cli)で zsh の設定(~/.zshrc, ~/.zsh/)と starship / Ghostty の設定を書き出す。新しいマシンのセットアップ、dotfiles の再インストール、zsh 設定の復元、「dotfiles をクローンしたい」「zshをセットアップしたい」と言われたときに使用する。'
---

# dotfiles から zsh をセットアップする

## これは何をするか

このリポジトリを `$HOME/workspace/dotfiles` にクローンし、[Homebrew](https://brew.sh/) で
zsh 設定が使うツールを揃え、[`my`](../../../my/README.md)(decopin-cli 製の CLI)をビルドして
`~/.zshrc` と `~/.zsh/`、starship / Ghostty の設定を**生成物として書き出す**。[bootstrap.sh](../../../bootstrap.sh) と同じ内容。

zsh の設定はソースファイルのコピーではない。ソースは [my/app/_lib/config.ts](../../../my/app/_lib/config.ts) で、
`my apply` がそこから生成する。

## 使うタイミング

- 新しい/まっさらなマシンで zsh をセットアップするとき
- `my/` を編集した後、設定を適用し直すとき
- 「このリポジトリを $HOME/workspace にクローンして zsh をセットアップして」と言われたとき

## 手順

### 0. 既にセットアップ済みのマシン

新規セットアップ(1・2)は不要。シェル起動時に `my pull` が裏で走り(1 時間に 1 回)、GitHub に
新しいコミットがあれば fast-forward して `my sync-local` 相当(bun install / link / `my apply`)まで行う。
手元に未コミットの変更や未 push のコミットがあるときは何もしない。結果は `~/.cache/my/pull.log`。

```bash
my pull --force           # 今すぐ取り込む(--dry-run で何コミット遅れているかだけ確認)
my sync-local             # 手で git pull した後に反映だけする
```

### 1. ワンショットのブートストラップ(まだローカルにクローンしていない場合)

```bash
curl -fsLS https://raw.githubusercontent.com/yuyakinjo/dotfiles/main/bootstrap.sh | bash
```

> 注意: Homebrew を新規インストールする場合、初回のみ `sudo` のパスワード入力が必要になることがある。
> `curl | bash` では tty が無く止まることがあるので、その場合はダウンロードしてから `bash bootstrap.sh` で実行する。

### 2. 手動での手順

1. クローンする(`$HOME/workspace/dotfiles` に置く):
   ```bash
   mkdir -p "$HOME/workspace" && cd "$HOME/workspace"
   gh repo clone yuyakinjo/dotfiles || git clone https://github.com/yuyakinjo/dotfiles.git
   cd dotfiles
   ```
2. Homebrew が無ければインストールする:
   ```bash
   command -v brew >/dev/null 2>&1 || /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
3. zsh 設定が使うツールをインストールする:
   ```bash
   brew install starship eza zoxide fzf fzf-tab oven-sh/bun/bun
   ```
4. `my` をビルドし、設定を書き出す:
   ```bash
   cd "$HOME/workspace/dotfiles/my" && bun install && bun run link
   "$HOME/.local/bin/my" apply
   ```
   `bun run link` は `~/.local/bin/my` と補完 `~/.zsh/completions/_my` を置く。`my apply` が
   `~/.zshrc`、`~/.zsh/init.zsh`、`aliases.zsh`、`functions.zsh`、`functions/*.zsh`、
   `~/.config/starship.toml`、Ghostty の `config.ghostty` を書く。
5. profile を選ぶ(省略時は `personal`):
   ```bash
   mkdir -p ~/.config/my && echo '{"profile": "work"}' > ~/.config/my/device.json
   ```
6. シェルを再読み込みする:
   ```bash
   exec zsh
   ```

### 3. 確認

- `my diff` が差分なし(exit 0)であること(starship / Ghostty も含む)
- `my --help` にコマンド一覧が出て、`my <Tab>` で補完が効くこと

## 補足

- 信頼できる情報源は `my/app/_lib/config.ts`。`~/.zshrc` や `~/.zsh/*.zsh` を直接編集しても、次の
  `my apply` で上書きされる。`my diff` がそのドリフトを見せる。
- zsh のまま配る断片(fzf の zle ウィジェット、ツール初期化)は [my/zsh/](../../../my/zsh/) にある。
