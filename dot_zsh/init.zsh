eval "$(starship init zsh)"

if command -v zoxide >/dev/null 2>&1; then
  eval "$(zoxide init zsh)"
fi

if command -v fzf >/dev/null 2>&1 && [[ -o interactive ]]; then
  autoload -Uz compinit
  if (( ! ${+_comps} )); then
    compinit
  fi

  if [[ -r /opt/homebrew/opt/fzf-tab/share/fzf-tab/fzf-tab.zsh ]]; then
    zstyle ':completion:*' menu no
    zstyle ':fzf-tab:*' fzf-command fzf
    zstyle ':fzf-tab:*' switch-group '<' '>'
    source /opt/homebrew/opt/fzf-tab/share/fzf-tab/fzf-tab.zsh
  fi
fi
