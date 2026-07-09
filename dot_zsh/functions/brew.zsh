# brew install / uninstall / reinstall の後に、Brewfile(chezmoiのdotfilesリポジトリ管理下)を
# 自動で再生成する。実行のたびに `brew bundle dump --force` が走るので、手動で書き忘れることがなくなる。
function brew() {
  emulate -L zsh

  command brew "$@"
  local exit_code=$?

  if (( exit_code == 0 )); then
    case "$1" in
      install|uninstall|remove|rm|reinstall)
        if command -v chezmoi >/dev/null 2>&1; then
          local source_dir brewfile
          source_dir="$(chezmoi source-path 2>/dev/null)"
          if [[ -n "$source_dir" ]]; then
            brewfile="$source_dir/Brewfile"
            if [[ -f "$brewfile" ]]; then
              command brew bundle dump --force --file="$brewfile"
              print "▶︎ Brewfile を更新しました: $brewfile"
            fi
          fi
        fi
        ;;
    esac
  fi

  return $exit_code
}
