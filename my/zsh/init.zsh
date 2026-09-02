eval "$(starship init zsh)"

if command -v zoxide >/dev/null 2>&1; then
  eval "$(zoxide init zsh)"
fi

if command -v fzf >/dev/null 2>&1 && [[ -o interactive ]]; then
  autoload -Uz compinit
  if (( ! ${+_comps} )); then
    compinit
  fi

  if (( $+commands[docker] )) && (( ! $+functions[_docker] )); then
    source <(docker completion zsh)
  fi

  if (( $+commands[docker-compose] )) && (( $+functions[_docker] )); then
    _docker_compose_native_completion() {
      local -a response candidates
      local output line candidate description directive=0

      output=$(docker-compose __complete "${words[3,CURRENT]}" 2>/dev/null)
      response=("${(@f)output}")

      if [[ ${response[-1]} == :<-> ]]; then
        directive=${response[-1]#:}
        response[-1]=()
      fi

      for line in "${response[@]}"; do
        if [[ $line == *$'\t'* ]]; then
          candidate=${line%%$'\t'*}
          description=${line#*$'\t'}
          candidates+=("${candidate//:/\\:}:${description}")
        else
          candidates+=("${line//:/\\:}")
        fi
      done

      if (( ${#candidates} )); then
        if (( directive & 2 )); then
          _describe 'docker compose value' candidates -- -S ''
        else
          _describe 'docker compose value' candidates
        fi
      elif (( !(directive & 4) )); then
        _files
      fi
    }

    _docker_with_compose_completion() {
      if [[ ${words[2]} == compose ]]; then
        _docker_compose_native_completion
      else
        _docker
      fi
    }
    compdef _docker_with_compose_completion docker
  fi

  if [[ -r /opt/homebrew/opt/fzf-tab/share/fzf-tab/fzf-tab.zsh ]]; then
    zstyle ':completion:*' menu no
    zstyle ':fzf-tab:*' fzf-command fzf
    zstyle ':fzf-tab:*' switch-group '<' '>'
    source /opt/homebrew/opt/fzf-tab/share/fzf-tab/fzf-tab.zsh
  fi
fi
