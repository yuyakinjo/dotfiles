---
name: backup-chezmoi-dotfiles
description: 'chezmoi 管理下の ~/.zshrc, ~/.zsh/ (dot_zsh/) へのローカルな変更を、この dotfiles リポジトリに取り込んで push する。dot_zsh/ の中身がローカルで変わったとき、「dotfiles をバックアップしたい」「dotfiles を同期し直したい」「chezmoi re-add したい」、ローカルの zsh 設定変更を commit/push したいときに使用する。'
---

# chezmoi の dotfiles をバックアップする

## これは何をするか

ローカルの `~/.zshrc` / `~/.zsh/`(このリポジトリの `dot_zshrc` / `dot_zsh/` を chezmoi が管理している)
への変更を、chezmoi のソースディレクトリ(`$HOME/workspace/dotfiles`)に取り込み、
[`dotfiles_sync`](../../../dot_zsh/functions/dotfiles_sync.zsh) 関数を使って commit・push する。

## 使うタイミング

- このリポジトリを編集する代わりに、`~/.zsh/` や `~/.zshrc` を直接編集してしまったとき
- 「dotfiles をバックアップして」「chezmoiをバックアップ」「ローカルの zsh 設定の変更をリポジトリに反映して」と言われたとき
- `dot_zsh/` の内容を変更した前後で、ローカルとリポジトリの状態を一致させたいとき

## 手順

### 0. 事前確認: 未コミットの変更がないか確認する

ソースディレクトリ(`$(chezmoi source-path)`)に**未コミットの変更**がある状態で
`dotfiles_sync` を実行すると、その変更も一緒に commit・push される。

実行前に必ず以下を確認する:

```bash
git -C "$(chezmoi source-path)" status --short
```

未コミットの変更がある場合は、`AskUserQuestionTool` を使ってユーザーに次のいずれかを確認する:

- その変更を今回のバックアップに含めてよいか
- その変更は一旦除外し、コミットせずに残しておくか(その場合は対象ファイルを退避してから実行する)

### 1. 推奨: `dotfiles_sync` 関数を使う

このリポジトリの設定が適用済みのシェル(`~/.zsh/functions/dotfiles_sync.zsh` が source 済み)であれば、
以下を実行するだけでよい:

```bash
dotfiles_sync                      # コミットメッセージは自動生成 ("update dotfiles")
dotfiles_sync "変更内容の説明"      # コミットメッセージを指定する場合
```

`chezmoi apply`(リポジトリの変更をデプロイ先へ反映)→ `chezmoi re-add`(デプロイ先の変更をソースへ取り込み)
を実行した後、ソースディレクトリ(`$(chezmoi source-path)`、すなわち `$HOME/workspace/dotfiles`)内の
変更を commit・push する。

### 2. 手動での代替手順(関数が読み込まれていない場合)

```bash
chezmoi apply
chezmoi re-add
source_dir="$(chezmoi source-path)"
git -C "$source_dir" --no-pager diff --stat
git -C "$source_dir" add -A
git -C "$source_dir" commit -m "update dotfiles"
git -C "$source_dir" push
```

### 3. 確認

- `chezmoi diff` で差分が無いこと(ローカルの状態とソースディレクトリが一致していること)を確認する
- `git -C "$(chezmoi source-path)" status` がクリーンであること
- `git -C "$(chezmoi source-path)" log -1` で新しいコミットが `main` に push されていることを確認する

## 補足

- `chezmoi re-add` は chezmoi が既に管理しているファイル(`dot_zshrc` / `dot_zsh/` 配下)への変更のみを取り込む。新規ファイルはまず `chezmoi add <path>` で追加する必要がある。
- これは [setup-zsh-dotfiles](../setup-zsh-dotfiles/SKILL.md) の逆方向の操作: あちらはリポジトリ → マシン(`chezmoi apply`)、こちらはマシン → リポジトリ(`chezmoi re-add`)を同期する。
