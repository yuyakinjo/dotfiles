# dotfiles

[chezmoi](https://www.chezmoi.io/) で管理している zsh 用の dotfiles。

## セットアップ

### 方法1: ワンライナー(新しいマシンで一気にセットアップ)

```bash
curl -fsLS https://raw.githubusercontent.com/yuyakinjo/dotfiles/main/bootstrap.sh | bash
```

[bootstrap.sh](./bootstrap.sh) が設定の適用までを一括で実行

### 方法2: エージェントのスキルを実行する

`claude` や `codex` などのエージェントに [setup-zsh-dotfiles スキル](./.agents/skills/setup-zsh-dotfiles/SKILL.md) を実行させる(手順はスキル側に定義済み)。

## 構成

```
bootstrap.sh          # ワンライナーセットアップ用スクリプト
Brewfile               # Homebrew でインストールするパッケージ一覧(brew install/uninstall後に自動更新される)
.chezmoi.toml.tmpl     # chezmoi 設定(sourceDir を ~/workspace/dotfiles に固定)
dot_zshrc              # ~/.zshrc になる
dot_zsh/
  init.zsh             # ツールの初期化(starship, zoxide など)
  aliases.zsh          # エイリアス
  functions.zsh        # dot_zsh/functions/ 配下を読み込む
  functions/           # 1ファイル1関数の zsh 関数集(brew.zsh, dotfiles_sync.zsh など)
```

## ローカルの変更をリポジトリに反映する

`~/.zshrc` や `~/.zsh/` を直接編集した場合は、変更をこのリポジトリに取り込んで push する:

```bash
dotfiles_sync                # コミットメッセージは自動生成
dotfiles_sync "変更内容の説明"
```

詳細は [backup-chezmoi-dotfiles スキル](./.agents/skills/backup-chezmoi-dotfiles/SKILL.md) を参照。
