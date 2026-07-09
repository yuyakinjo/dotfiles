#!/usr/bin/env bash
# Bootstrap script: sets up $HOME/workspace/dotfiles via chezmoi and applies zsh config.
# Usage: curl -fsLS https://raw.githubusercontent.com/yuyakinjo/dotfiles/main/bootstrap.sh | bash
set -euo pipefail

REPO="https://github.com/yuyakinjo/dotfiles.git"
WORKSPACE="$HOME/workspace"
SOURCE_DIR="$WORKSPACE/dotfiles"

mkdir -p "$WORKSPACE"

if ! command -v chezmoi >/dev/null 2>&1; then
  if command -v brew >/dev/null 2>&1; then
    brew install chezmoi
  else
    sh -c "$(curl -fsLS get.chezmoi.io)"
  fi
fi

chezmoi init --apply --source "$SOURCE_DIR" "$REPO"

echo "zsh setup complete. Restart your shell or run: exec zsh"
