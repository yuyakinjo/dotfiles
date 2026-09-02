import { Arg, Argv } from 'decopin-cli';

export default function DefineArgv() {
  return (
    <Argv description="Apply, then commit and push the dotfiles repo.">
      <Arg name="message" type="string" default="update dotfiles" description="commit message" />
    </Argv>
  );
}
