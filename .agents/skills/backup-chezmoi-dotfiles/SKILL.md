---
name: backup-chezmoi-dotfiles
description: 'この dotfiles リポジトリの変更(my/ の zsh 設定ソース、chezmoi 管理の starship / Ghostty / Brewfile)を commit・push する。「dotfiles をバックアップしたい」「dotfiles を同期し直したい」、ローカルの設定変更をリポジトリに反映したいときに使用する。'
---

# dotfiles をバックアップする

## これは何をするか

このリポジトリ(`$HOME/workspace/dotfiles`)の変更を commit・push する。

- **zsh の設定**は [my/app/_lib/config.ts](../../../my/app/_lib/config.ts) がソース。`~/.zshrc` / `~/.zsh/` は
  `my apply` の生成物なので、chezmoi の `re-add` の対象ではない。手で `~/.zsh/*.zsh` を編集していたら
  `my diff` に出るので、その内容を `config.ts` か `my/zsh/` に移してから `my apply` する
- **starship / Ghostty** は chezmoi が管理する。`~/.config/starship.toml` を直接編集していたら `chezmoi re-add` で取り込む
- **Brewfile** は `brew install / uninstall` のたびに自動で更新されている(brew ラッパー関数)

## 使うタイミング

- 「dotfiles をバックアップして」「ローカルの設定変更をリポジトリに反映して」と言われたとき
- `my/` を編集して `my apply` した後、リポジトリを push したいとき

## 手順

### 0. 事前確認: 未コミットの変更を見る

```bash
git -C "$HOME/workspace/dotfiles" status --short
my diff
chezmoi diff
```

`my sync` はリポジトリの**全部の変更**を commit・push する。意図しない変更が混ざっていないかを見て、
混ざっていれば `AskUserQuestionTool` でユーザーに含めるか確認する。

### 1. ドリフトがあれば先に解消する

- `my diff` に差分がある → 実ファイル側の変更を `my/app/_lib/config.ts` か `my/zsh/` に移し、
  `cd ~/workspace/dotfiles/my && bun run link && my apply` で差分をゼロにする
- `chezmoi diff` に差分がある → `chezmoi re-add`(デプロイ先の変更をソースへ)か `chezmoi apply`(ソースをデプロイ先へ)

### 2. commit・push する

```bash
my sync "変更内容の説明"     # 省略時は "update dotfiles"
my sync --dry-run             # 何が commit されるかだけ見る
```

手動なら:

```bash
git -C "$HOME/workspace/dotfiles" add -A
git -C "$HOME/workspace/dotfiles" commit -m "update dotfiles"
git -C "$HOME/workspace/dotfiles" push
```

### 3. 確認

- `my diff` と `chezmoi diff` が差分なし
- `git -C "$HOME/workspace/dotfiles" status` がクリーンで、`log -1` が push 済み

## 補足

- これは [setup-zsh-dotfiles](../setup-zsh-dotfiles/SKILL.md) の逆方向: あちらはリポジトリ → マシン、こちらはマシン → リポジトリ。
