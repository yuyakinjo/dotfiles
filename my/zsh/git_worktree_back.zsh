git_worktree_back() {
  if (( ${#_git_worktree_ls_dir_stack[@]} == 0 )); then
    echo "git_worktree_back: no previous worktree location" >&2
    return 1
  fi

  local previous_dir="${_git_worktree_ls_dir_stack[-1]}"
  cd -- "$previous_dir" || return
  _git_worktree_ls_dir_stack[-1]=()
}
