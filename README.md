# dotfiles

[chezmoi](https://www.chezmoi.io/) で管理している zsh 用の dotfiles。

## セットアップ

### 方法1: ワンライナー(新しいマシンで一気にセットアップ)

```bash
curl -fsLS https://raw.githubusercontent.com/yuyakinjo/dotfiles/main/bootstrap.sh | bash
```

[bootstrap.sh](./bootstrap.sh) が chezmoi のインストール、`$HOME/workspace/dotfiles` へのクローン、
設定の適用までを一括で行う。

### 方法2: 手動セットアップ

1. workspace ディレクトリを作成し、そこに移動してからクローンする:
   ```bash
   mkdir -p "$HOME/workspace"
   cd "$HOME/workspace"
   gh repo clone yuyakinjo/dotfiles || git clone https://github.com/yuyakinjo/dotfiles.git
   cd dotfiles
   ```
2. chezmoi をインストールする(未インストールの場合):
   ```bash
   command -v chezmoi >/dev/null 2>&1 || brew install chezmoi
   ```
3. chezmoi を初期化し、設定を適用する:
   ```bash
   chezmoi init --apply --source "$HOME/workspace/dotfiles" "https://github.com/yuyakinjo/dotfiles.git"
   ```
4. シェルを再読み込みする:
   ```bash
   exec zsh
   ```

詳細な手順は [setup-zsh-dotfiles スキル](./.agents/skills/setup-zsh-dotfiles/SKILL.md) を参照。

## 構成

```
bootstrap.sh          # ワンライナーセットアップ用スクリプト
.chezmoi.toml.tmpl     # chezmoi 設定(sourceDir を ~/workspace/dotfiles に固定)
dot_zshrc              # ~/.zshrc になる
dot_zsh/
  init.zsh             # ツールの初期化(starship, zoxide など)
  aliases.zsh          # エイリアス
  functions.zsh        # dot_zsh/functions/ 配下を読み込む
  functions/           # 1ファイル1関数の zsh 関数集
```

## ローカルの変更をリポジトリに反映する

`~/.zshrc` や `~/.zsh/` を直接編集した場合は、変更をこのリポジトリに取り込んで push する:

```bash
dotfiles_sync                # コミットメッセージは自動生成
dotfiles_sync "変更内容の説明"
```

詳細は [backup-chezmoi-dotfiles スキル](./.agents/skills/backup-chezmoi-dotfiles/SKILL.md) を参照。

## エージェント向けスキル

`claude` や `codex` などのエージェントから使えるスキルを [.agents/skills/](./.agents/skills/) に用意している
(`.claude/skills`, `.codex/skills` はそこへのシンボリックリンク)。

| スキル | 内容 |
| --- | --- |
| [setup-zsh-dotfiles](./.agents/skills/setup-zsh-dotfiles/SKILL.md) | このリポジトリをクローンして zsh 設定を適用する(repo → machine) |
| [backup-chezmoi-dotfiles](./.agents/skills/backup-chezmoi-dotfiles/SKILL.md) | ローカルの変更をこのリポジトリに取り込んで push する(machine → repo) |
