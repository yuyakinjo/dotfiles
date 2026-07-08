if command -v fzf >/dev/null 2>&1 && [[ -o interactive ]]; then
  typeset -ga _git_worktree_ls_dir_stack

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

  git_worktree_ls() {
    if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
      echo "git_worktree_ls: not inside a git worktree" >&2
      return 1
    fi

    local current selected worktree_path
    current="$(git rev-parse --show-toplevel 2>/dev/null)" || return
    selected="$(
      git worktree list --porcelain |
        awk -v current="$current" '
          function emit() {
            if (path == "") return
            label = branch
            if (label == "") label = detached
            if (label == "") label = "(no branch)"
            marker = (path == current) ? "current" : ""
            printf "%s\t%s\t%s\n", path, label, marker
          }
          /^worktree / {
            emit()
            path = substr($0, 10)
            branch = ""
            detached = ""
            next
          }
          /^branch / {
            branch = substr($0, 8)
            sub("^refs/heads/", "", branch)
            next
          }
          /^detached$/ {
            detached = "detached"
            next
          }
          END { emit() }
        ' |
        fzf --height 40% --min-height 20+ --layout=reverse --scheme=path --delimiter='\t' --with-nth=2,3,1 --nth=1,2 --prompt='worktree> '
    )" || return

    [[ -n "$selected" ]] || return 0
    worktree_path="${selected%%$'\t'*}"
    local previous_dir="$PWD"

    [[ "$worktree_path" == "$PWD" ]] && return 0
    cd -- "$worktree_path" || return
    _git_worktree_ls_dir_stack+=("$previous_dir")
  }

  git_worktree_back() {
    if (( ${#_git_worktree_ls_dir_stack[@]} == 0 )); then
      echo "git_worktree_back: no previous worktree location" >&2
      return 1
    fi

    local previous_dir="${_git_worktree_ls_dir_stack[-1]}"
    cd -- "$previous_dir" || return
    _git_worktree_ls_dir_stack[-1]=()
  }

  zle -N fzf-history-widget
  bindkey -M emacs '^R' fzf-history-widget
  bindkey -M vicmd '^R' fzf-history-widget
  bindkey -M viins '^R' fzf-history-widget

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
