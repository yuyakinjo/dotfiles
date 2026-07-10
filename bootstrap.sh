#!/usr/bin/env bash
# ブートストラップスクリプト: この dotfiles リポジトリを使って新しいマシンをセットアップする。
# - Homebrew(未インストールの場合)と Brewfile に書かれたパッケージをインストールする
# - chezmoi 経由で $HOME/workspace/dotfiles をクローンし、zsh 設定を適用する
# 使い方: curl -fsLS https://raw.githubusercontent.com/yuyakinjo/dotfiles/main/bootstrap.sh | bash
set -euo pipefail

REPO="https://github.com/yuyakinjo/dotfiles.git"
WORKSPACE="$HOME/workspace"
SOURCE_DIR="$WORKSPACE/dotfiles"

mkdir -p "$WORKSPACE"

if ! command -v brew >/dev/null 2>&1; then
  NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  eval "$(/opt/homebrew/bin/brew shellenv 2>/dev/null || /usr/local/bin/brew shellenv)"
fi

if ! command -v chezmoi >/dev/null 2>&1; then
  brew install chezmoi
fi

chezmoi init --apply --source "$SOURCE_DIR" "$REPO"

if [[ -f "$SOURCE_DIR/Brewfile" ]]; then
  echo "Installing packages from Brewfile..."
  brew bundle --file="$SOURCE_DIR/Brewfile"
fi

echo "zsh setup complete. Restart your shell or run: exec zsh"
