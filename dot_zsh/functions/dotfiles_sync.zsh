# chezmoi管理下のdotfiles(~/.zshrc, ~/.zsh など)を取り込み・コミット・pushまで一括実行する
# 使い方:
#   dotfiles_sync                # 追跡中のファイルの変更を取り込んでpush（コミットメッセージは自動生成）
#   dotfiles_sync "コミットメッセージ"
function dotfiles_sync() {
  emulate -L zsh

  if ! command -v chezmoi >/dev/null 2>&1; then
    print -u2 "dotfiles_sync: chezmoi コマンドが見つかりません"
    return 1
  fi

  local message="${1:-update dotfiles}"
  local source_dir
  source_dir="$(chezmoi source-path)" || return 1

  print "▶︎ ローカル環境に適用中..."
  chezmoi apply

  print "▶︎ chezmoi管理下のファイルの変更を取り込み中..."
  chezmoi re-add

  if git -C "$source_dir" diff --quiet && git -C "$source_dir" diff --cached --quiet; then
    print "▶︎ 変更はありませんでした"
    return 0
  fi

  print "\n▶︎ 変更内容:"
  git -C "$source_dir" --no-pager diff --stat

  git -C "$source_dir" add -A
  git -C "$source_dir" commit -m "$message"
  git -C "$source_dir" push
}
