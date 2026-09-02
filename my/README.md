# my

decopin-cli で作った、自分用の CLI。`.zshrc` はこの CLI の**生成物**で、ソースは
`app/_lib/` の TypeScript。alias の暗記と dotfiles 同期を `my <command>` の探索に置き換える。

```sh
bun install
bun run link          # dist/index.js を ~/.local/bin/my に
my diff               # 生成物と ~/.zshrc, ~/.zsh/* の差分
my apply              # 書き込む (--dry-run で何が変わるかだけ)
```

生成される `.zshrc` が `eval "$(my __shell zsh)"` と補完の `fpath` を入れるので、
`my worktree go` の `cd` や `my reload` の `source` は親シェルに届く。

profile は `~/.config/my/device.json` の `{"profile": "personal"}` で選ぶ
(`work` / `personal` / `server`)。無ければ `personal`。
