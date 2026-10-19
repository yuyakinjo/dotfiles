import { Argv, Option } from 'decopin-cli';

export default function DefineArgv() {
  return (
    <Argv description="GitHub の dotfiles を fetch し、fast-forward できるときだけ pull して sync-local する。シェル起動時に裏で走る (1 時間に 1 回)。">
      <Option name="force" type="boolean" default={false} description="前回から 1 時間経っていなくても fetch する" />
    </Argv>
  );
}
