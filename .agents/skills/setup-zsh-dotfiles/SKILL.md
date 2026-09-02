---
name: setup-zsh-dotfiles
description: 'yuyakinjo/dotfiles を $HOME/workspace にクローンし、Homebrew(Brewfile)でツールを揃え、chezmoi で starship / Ghostty の設定を、`my` CLI(decopin-cli)で zsh の設定(~/.zshrc, ~/.zsh/)を書き出す。新しいマシンのセットアップ、dotfiles の再インストール、zsh 設定の復元、「dotfiles をクローンしたい」「zshをセットアップしたい」と言われたときに使用する。'
---

# dotfiles から zsh をセットアップする

## これは何をするか

このリポジトリを `$HOME/workspace/dotfiles` にクローンし、[Homebrew](https://brew.sh/) で
[Brewfile](../../../Brewfile) のツールを揃え、[chezmoi](https://www.chezmoi.io/) で zsh 以外の設定
(starship, Ghostty)を適用し、[`my`](../../../my/README.md)(decopin-cli 製の CLI)をビルドして
`~/.zshrc` と `~/.zsh/` を**生成物として書き出す**。[bootstrap.sh](../../../bootstrap.sh) と同じ内容。

zsh の設定はソースファイルのコピーではない。ソースは [my/app/_lib/config.ts](../../../my/app/_lib/config.ts) で、
`my apply` がそこから生成する。

## 使うタイミング

- 新しい/まっさらなマシンで zsh をセットアップするとき
- `my/` を編集した後、設定を適用し直すとき
- 「このリポジトリを $HOME/workspace にクローンして zsh をセットアップして」と言われたとき

## 手順

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
2. Homebrew と chezmoi が無ければインストールする:
   ```bash
   command -v brew >/dev/null 2>&1 || /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   command -v chezmoi >/dev/null 2>&1 || brew install chezmoi
   ```
3. chezmoi を初期化して zsh 以外の設定を適用する:
   ```bash
   chezmoi init --apply --source "$HOME/workspace/dotfiles" "https://github.com/yuyakinjo/dotfiles.git"
   ```
4. Brewfile のパッケージをインストールする(bun もここで入る):
   ```bash
   brew bundle --file="$HOME/workspace/dotfiles/Brewfile"
   ```
5. `my` をビルドし、zsh の設定を書き出す:
   ```bash
   cd "$HOME/workspace/dotfiles/my" && bun install && bun run link
   "$HOME/.local/bin/my" apply
   ```
   `bun run link` は `~/.local/bin/my` と補完 `~/.zsh/completions/_my` を置く。`my apply` が
   `~/.zshrc`、`~/.zsh/init.zsh`、`aliases.zsh`、`functions.zsh`、`functions/*.zsh` を書く。
6. profile を選ぶ(省略時は `personal`):
   ```bash
   mkdir -p ~/.config/my && echo '{"profile": "work"}' > ~/.config/my/device.json
   ```
7. シェルを再読み込みする:
   ```bash
   exec zsh
   ```

### 3. 確認

- `my diff` が差分なし(exit 0)であること
- `my --help` にコマンド一覧が出て、`my <Tab>` で補完が効くこと
- `chezmoi diff` で差分が無いこと(starship / Ghostty)

## 補足

- 信頼できる情報源は `my/app/_lib/config.ts`。`~/.zshrc` や `~/.zsh/*.zsh` を直接編集しても、次の
  `my apply` で上書きされる。`my diff` がそのドリフトを見せる。
- zsh のまま配る断片(brew ラッパー、fzf の zle ウィジェット、ツール初期化)は [my/zsh/](../../../my/zsh/) にある。
