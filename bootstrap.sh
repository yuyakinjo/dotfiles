#!/usr/bin/env bash
# Bootstrap script: sets up a new machine using this dotfiles repo.
# - installs Homebrew (if missing) and the tools the zsh config needs
# - clones $HOME/workspace/dotfiles and applies the config with the `my` CLI
# Usage: curl -fsLS https://raw.githubusercontent.com/yuyakinjo/dotfiles/main/bootstrap.sh | bash
set -euo pipefail

REPO="https://github.com/yuyakinjo/dotfiles.git"
WORKSPACE="$HOME/workspace"
SOURCE_DIR="$WORKSPACE/dotfiles"

mkdir -p "$WORKSPACE"

if ! command -v brew >/dev/null 2>&1; then
  NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  eval "$(/opt/homebrew/bin/brew shellenv 2>/dev/null || /usr/local/bin/brew shellenv)"
fi

if [ ! -d "$SOURCE_DIR/.git" ]; then
  git clone "$REPO" "$SOURCE_DIR"
fi

echo "Installing tools used by the zsh config..."
brew install starship eza zoxide fzf fzf-tab

# zsh / starship / Ghostty config is written by the `my` CLI (decopin-cli)
if ! command -v bun >/dev/null 2>&1; then
  brew install oven-sh/bun/bun
fi
echo "Building my and writing ~/.zshrc, ~/.zsh/, starship, Ghostty ..."
(cd "$SOURCE_DIR/my" && bun install && bun run link)
"$HOME/.local/bin/my" apply

echo "zsh setup complete. Restart your shell or run: exec zsh"
