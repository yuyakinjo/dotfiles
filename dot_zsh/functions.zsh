# ~/.zsh/functions/ 配下のファイル(1ファイル1関数)を読み込む
if [[ -d "$HOME/.zsh/functions" ]]; then
  for _zsh_function_file in "$HOME/.zsh/functions"/*.zsh(N); do
    source "$_zsh_function_file"
  done
  unset _zsh_function_file
fi