# zerobrew 0.4 の対応コマンド・オプションだけを通す。未対応の構文は Homebrew へ。
function _my_brew_supports_zb() {
  emulate -L zsh

  local subcommand="${1:-}" arg
  local -i operands=0 skip_file=0 end_options=0 show_help=0
  (( $# )) || return 1
  shift

  case "$subcommand" in
    bundle)
      case "${1:-}" in
        install|dump) subcommand="bundle-$1"; shift ;;
        help)
          shift
          [[ $# == 0 || ( $# == 1 && ( $1 == install || $1 == dump ) ) ]]
          return $?
          ;;
        ''|-*) subcommand=bundle-install ;;
        *) return 1 ;;
      esac
      ;;
    help)
      (( $# )) || return 0
      _my_brew_supports_zb "$@"
      return $?
      ;;
    # run の後半の引数は、zb ではなく実行するプログラムのもの。
    run) return 0 ;;
    install|uninstall|migrate|list|info|doctor|gc|reset|init|completion|update|outdated|upgrade) ;;
    *) return 1 ;;
  esac

  for arg in "$@"; do
    if (( skip_file )); then
      skip_file=0
      continue
    fi
    if (( end_options )); then
      (( operands += 1 ))
      continue
    fi
    case "$arg" in
      --) end_options=1 ;;
      -h|--help) show_help=1 ;;
      --auto-init|-v|-vv|-vvv|--verbose|-q|--quiet) ;;
      -*)
        case "$subcommand:$arg" in
          install:--no-link|install:-s|install:--build-from-source|\
          upgrade:--no-link|upgrade:-s|upgrade:--build-from-source|\
          uninstall:--all|migrate:-y|migrate:--yes|migrate:--force|\
          doctor:--repair|reset:-y|reset:--yes|init:--no-modify-path|\
          outdated:--json|bundle-install:--no-link|bundle-dump:--force) ;;
          bundle-install:-f|bundle-install:--file|bundle-dump:-f|bundle-dump:--file)
            skip_file=1
            ;;
          bundle-install:--file=*|bundle-dump:--file=*|bundle-install:-f?*|bundle-dump:-f?*) ;;
          *) return 1 ;;
        esac
        ;;
      *) (( operands += 1 )) ;;
    esac
  done
  (( skip_file == 0 )) || return 1
  (( show_help )) && return 0
  case "$subcommand" in
    info) (( operands == 1 )) || return 1 ;;
    list|doctor|gc|reset|init|update|outdated|bundle-install|bundle-dump)
      (( operands == 0 )) || return 1
      ;;
  esac
  return 0
}

# 所有元を混ぜない。dump が失敗しても以前のファイルと元コマンドの終了コードを保つ。
function _my_brew_update_brewfiles() {
  emulate -L zsh

  command -v chezmoi >/dev/null 2>&1 || return 0
  local source_dir manager brewfile temporary
  local root="${ZEROBREW_ROOT:-/opt/zerobrew}"
  local -i dumped
  source_dir="$(command chezmoi source-path 2>/dev/null)" || return 0
  [[ -n "$source_dir" && -f "$source_dir/Brewfile" ]] || return 0

  for manager in brew zb; do
    brewfile="$source_dir/Brewfile"
    if [[ "$manager" == zb ]]; then
      command -v zb >/dev/null 2>&1 || continue
      # 未初期化のマシンで、リポジトリのバックアップを空にしない。
      [[ -f "$root/db/zb.sqlite3" || "$1:$2" == zb:reset ]] || continue
      brewfile="$source_dir/Brewfile.zerobrew"
    fi
    temporary="$(command mktemp "$brewfile.tmp.XXXXXX")" || {
      print -u2 "⚠︎ Brewfile の一時ファイルを作成できませんでした: $brewfile"
      continue
    }
    dumped=0
    if [[ "$manager:$1:$2" == zb:zb:reset ]]; then
      # reset は DB 自体を削除するため、成功したときだけ空の一覧を保存する。
      : > "$temporary" && dumped=1
    elif ZEROBREW_AUTO_INIT=false command "$manager" bundle dump --force --file="$temporary" </dev/null >/dev/null; then
      dumped=1
    fi
    if (( dumped )) && command mv -f "$temporary" "$brewfile"; then
      print "▶︎ Brewfile を更新しました: $brewfile"
    else
      command rm -f "$temporary"
      print -u2 "⚠︎ Brewfile の更新に失敗しました。以前の内容を保持します: $brewfile"
    fi
  done
}

# brew の名前を保ち、zb にないコマンド・オプションは本家へルーティングする。
# `brew --homebrew ...` は本家を明示しつつ、自動バックアップも行う。
function brew() {
  emulate -L zsh

  local -a args=("$@") zb_args
  local backend=brew arg
  local -i force_homebrew=0 has_file=0 should_sync=0
  if [[ "${args[1]:-}" == --homebrew ]]; then
    args[1]=()
    force_homebrew=1
  fi
  zb_args=("${args[@]}")
  case "${zb_args[1]:-}" in
    remove|rm) zb_args[1]=uninstall ;;
    ls) zb_args[1]=list ;;
  esac

  if (( ! force_homebrew )) && command -v zb >/dev/null 2>&1 && _my_brew_supports_zb "${zb_args[@]}"; then
    backend=zb
    if [[ "${zb_args[1]:-}" == bundle && "${zb_args[2]:-}" != help ]]; then
      case "${zb_args[2]:-}" in
        install|dump) ;;
        *) zb_args=(bundle install "${zb_args[@]:1}") ;;
      esac
      for arg in "${zb_args[@]}"; do
        case "$arg" in
          -f|--file|--file=*|-f?*) has_file=1 ;;
        esac
      done
      # 暗黙の bundle で Homebrew 用の Brewfile を読み書きしない。
      (( has_file )) || zb_args+=(--file=Brewfile.zerobrew)
    fi
    command zb "${zb_args[@]}"
  else
    command brew "${args[@]}"
  fi
  local exit_code=$?

  # 実行失敗時に別マネージャーで再試行しない（二重インストール防止）。
  if (( exit_code == 0 )); then
    case "${args[1]:-}" in
      install|uninstall|remove|rm|reinstall|upgrade|migrate|reset|tap|untap) should_sync=1 ;;
      bundle)
        case "${args[2]:-}" in
          ''|install|-*) should_sync=1 ;;
        esac
        ;;
    esac
    for arg in "${args[@]}"; do
      case "$arg" in
        -h|--help|-n|--dry-run) should_sync=0 ;;
      esac
    done
    (( should_sync )) && _my_brew_update_brewfiles "$backend" "${args[1]:-}"
  fi
  return $exit_code
}
