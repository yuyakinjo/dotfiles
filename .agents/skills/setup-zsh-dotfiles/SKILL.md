---
name: setup-zsh-dotfiles
description: 'yuyakinjo/dotfiles を $HOME/workspace にクローンし、chezmoi を使って zsh の設定(dot_zshrc, dot_zsh/)を適用する。新しいマシンのセットアップ、dotfiles の再インストール、zsh 設定の復元、「dotfiles をクローンしたい」「zshをセットアップしたい」と言われたときに使用する。'
---

# dotfiles から zsh をセットアップする

## これは何をするか

このリポジトリを `$HOME/workspace/dotfiles` にクローンし、[chezmoi](https://www.chezmoi.io/)
を使って zsh の設定(`dot_zshrc` → `~/.zshrc`、`dot_zsh/` → `~/.zsh/`)を対象のマシンに適用する。
[bootstrap.sh](../../../bootstrap.sh) と同じ内容。

## 使うタイミング

- 新しい/まっさらなマシンで zsh をセットアップするとき
- このリポジトリを編集した後、再度設定を適用し直すとき
- 「このリポジトリを $HOME/workspace にクローンして zsh をセットアップして」と言われたとき

## 手順

### 1. ワンショットのブートストラップ(まだローカルにクローンしていない場合)

リポジトリの bootstrap スクリプトを直接実行する。chezmoi が無ければインストールし、
このリポジトリを chezmoi のソースディレクトリとして `$HOME/workspace/dotfiles` にクローンし、
設定を適用する:

```bash
curl -fsLS https://raw.githubusercontent.com/yuyakinjo/dotfiles/main/bootstrap.sh | bash
```

### 2. 手動での手順(すでにクローン済み、または bootstrap.sh が使えない場合)

1. workspace ディレクトリを作成し、そこに移動してからクローンする(`$HOME/workspace/dotfiles`
   に確実に配置するため、必ず `cd` してからクローンする):
   ```bash
   mkdir -p "$HOME/workspace"
   cd "$HOME/workspace"
   gh repo clone yuyakinjo/dotfiles || git clone https://github.com/yuyakinjo/dotfiles.git
   cd dotfiles
   ```
2. chezmoi が無ければインストールする:
   ```bash
   command -v chezmoi >/dev/null 2>&1 || brew install chezmoi
   ```
3. このリポジトリをソースディレクトリとして chezmoi を初期化し、適用する:
   ```bash
   chezmoi init --apply --source "$HOME/workspace/dotfiles" "https://github.com/yuyakinjo/dotfiles.git"
   ```
   これにより `dot_zshrc` → `~/.zshrc`、`dot_zsh/` → `~/.zsh/` が chezmoi の `dot_` 命名規則
   に従ってシンボリックリンク/コピーされる(`sourceDir` を `~/workspace/dotfiles` に固定している
   `.chezmoi.toml.tmpl` を参照)。
4. シェルを再読み込みする:
   ```bash
   exec zsh
   ```

### 3. 確認

- `~/.zshrc` が `$HOME/.zsh/init.zsh`、`aliases.zsh`、`functions.zsh` を source していること(参照: [dot_zshrc](../../../dot_zshrc))
- `chezmoi diff` で差分が無いことを確認する
- リポジトリのファイルを変更したら、いつでも `chezmoi apply` を再実行して `~/.zshrc` と `~/.zsh/` を同期する

## 補足

- 常に信頼できる情報源は `$HOME/workspace/dotfiles`(chezmoi のソースディレクトリ)であり、
  `~/.zshrc` を直接編集するのではなく、こちらを編集してから `chezmoi apply` すること。
- 関数ファイルは [dot_zsh/functions/](../../../dot_zsh/functions/) 配下にあり(例: `dotfiles_sync.zsh`、
  `fzf-history-widget.zsh`)、[dot_zsh/functions.zsh](../../../dot_zsh/functions.zsh) 経由で source される。
