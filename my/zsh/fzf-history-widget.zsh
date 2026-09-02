if command -v fzf >/dev/null 2>&1 && [[ -o interactive ]]; then
  fzf-history-widget() {
    local selected ret
    selected="$(
      fc -rl 1 2>/dev/null |
        awk '{ sub(/^[ \t]*[0-9]+\**[ \t]+/, ""); if (!seen[$0]++) print }' |
        fzf --height 40% --min-height 20+ --layout=reverse --scheme=history --bind=ctrl-r:toggle-sort --query="$LBUFFER"
    )"
    ret=$?

    if [[ -n "$selected" ]]; then
      BUFFER="$selected"
      CURSOR=${#BUFFER}
    fi

    zle reset-prompt
    return $ret
  }

  zle -N fzf-history-widget
  bindkey -M emacs '^R' fzf-history-widget
  bindkey -M vicmd '^R' fzf-history-widget
  bindkey -M viins '^R' fzf-history-widget
fi
