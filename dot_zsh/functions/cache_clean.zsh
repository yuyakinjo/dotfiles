# 開発ツール系のキャッシュを一括削除してディスク容量を回収する
# 使い方:
#   cache_clean            # Homebrew / uv / npm / bun / pnpm のキャッシュを削除
#   cache_clean --aerials  # 上記に加えて macOS 空撮壁紙の動画キャッシュも削除
#   cache_clean --dry-run  # 削除せずに各キャッシュの現在サイズだけ表示
# 注意: OrbStack のイメージや Ollama のモデルは残すものを選ぶ必要があるため対象外
#   OrbStack: docker system prune / Ollama: ollama rm <model>
function cache_clean() {
  emulate -L zsh

  local dry_run=0 with_aerials=0 arg
  for arg in "$@"; do
    case "$arg" in
      --dry-run) dry_run=1 ;;
      --aerials) with_aerials=1 ;;
      -h|--help)
        print "usage: cache_clean [--dry-run] [--aerials]"
        return 0
        ;;
      *)
        print -u2 "cache_clean: unknown option: $arg"
        print -u2 "usage: cache_clean [--dry-run] [--aerials]"
        return 1
        ;;
    esac
  done

  local aerials_dir="$HOME/Library/Application Support/com.apple.wallpaper/aerials/videos"
  local data_volume="/System/Volumes/Data"

  # 対象キャッシュの現在サイズを表示 (書式は "名前:パス")
  # 変数名 path は zsh の PATH 連動配列と衝突するため使用しない
  local entry name cache_path
  local -a targets=(
    "Homebrew:$HOME/Library/Caches/Homebrew"
    "uv:$HOME/.cache/uv"
    "npm:$HOME/.npm/_cacache"
    "bun:$HOME/.bun/install/cache"
    "pnpm:$HOME/Library/pnpm"
  )
  (( with_aerials )) && targets+=("aerials:$aerials_dir")

  print "▶︎ 対象キャッシュの現在サイズ"
  local du_out size
  for entry in "${targets[@]}"; do
    name="${entry%%:*}"
    cache_path="${entry#*:}"
    if [[ -e "$cache_path" ]]; then
      du_out="$(du -xsh "$cache_path" 2>/dev/null)"
      size="${${=du_out}[1]:--}"
      printf "  %-10s %8s  %s\n" "$name" "$size" "${cache_path/#$HOME/~}"
    else
      printf "  %-10s %8s  %s (なし)\n" "$name" "-" "${cache_path/#$HOME/~}"
    fi
  done

  if (( dry_run )); then
    print "▶︎ --dry-run のため削除は行いません"
    return 0
  fi

  local avail_before avail_after
  avail_before="$(df -k "$data_volume" 2>/dev/null | awk 'NR==2 {print $4}')"

  if command -v brew >/dev/null 2>&1; then
    print "\n▶︎ Homebrew キャッシュを削除中..."
    brew cleanup --prune=all
  fi

  if command -v uv >/dev/null 2>&1; then
    print "\n▶︎ uv キャッシュを削除中..."
    uv cache clean
  fi

  if command -v npm >/dev/null 2>&1; then
    print "\n▶︎ npm キャッシュを削除中..."
    npm cache clean --force
  fi

  if command -v bun >/dev/null 2>&1; then
    print "\n▶︎ bun キャッシュを削除中..."
    bun pm cache rm
  fi

  if command -v pnpm >/dev/null 2>&1; then
    print "\n▶︎ pnpm ストアの未参照パッケージを削除中..."
    pnpm store prune
  fi

  if (( with_aerials )) && [[ -d "$aerials_dir" ]]; then
    print "\n▶︎ 空撮壁紙の動画キャッシュを削除中..."
    print "  (使用中の空撮壁紙がある場合、その動画のみ再ダウンロードされます)"
    rm -f -- "$aerials_dir"/*.mov(N)
    killall WallpaperAgent 2>/dev/null
    killall idleassetsd 2>/dev/null
  fi

  avail_after="$(df -k "$data_volume" 2>/dev/null | awk 'NR==2 {print $4}')"
  if [[ -n "$avail_before" && -n "$avail_after" ]]; then
    printf "\n▶︎ 完了: 空き容量 %.1fGB → %.1fGB (+%.1fGB)\n" \
      $(( avail_before / 1048576.0 )) \
      $(( avail_after / 1048576.0 )) \
      $(( (avail_after - avail_before) / 1048576.0 ))
  else
    print "\n▶︎ 完了"
  fi
}
