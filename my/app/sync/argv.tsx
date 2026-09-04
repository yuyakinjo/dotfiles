import { Arg, Argv } from 'decopin-cli';

export default function DefineArgv() {
  return (
    <Argv description="apply してから dotfiles リポジトリをコミットして push する。">
      <Arg name="message" type="string" default="update dotfiles" description="コミットメッセージ" />
    </Argv>
  );
}
